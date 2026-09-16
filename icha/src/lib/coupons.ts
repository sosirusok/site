/**
 * 쿠폰 발급/사용.
 *  - 승인된 영수증으로 사이드를 고를 수 있는 기간은 쿠폰 유효일과 같다(승인 시각 + couponValidDays).
 *  - 쿠폰 만료는 발급일 기준 N일 뒤 23:59:59(KST). 화면에 "10월 16일까지"로 보이는 날의 끝까지 쓸 수 있다.
 */
import { randomInt } from "node:crypto";
import { REASONS, type Rules, type StoreId } from "./config";
import { one, tx } from "./db";
import { audit, getCoupon, getMenuItem, getReceipt, isUuid, listMembers, type Coupon, type Receipt } from "./db/queries";
import { getRules } from "./settings";
import { giftStoresFor, getStore } from "./stores";

export class CouponError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 0/O/1/I/L 제외

export function generateCode(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateCode();
    const hit = await one(`select 1 from coupons where code=$1`, [code]);
    if (!hit) return code;
  }
  throw new CouponError("쿠폰 코드를 만들지 못했습니다. 다시 시도해 주십시오.", 500);
}

const KST_MS = 9 * 3600 * 1000;

/** from 기준 days 일 뒤 그날의 23:59:59(KST). days=0 이면 오늘 끝. */
export function expiresAtKst(from: Date, days: number): Date {
  const k = new Date(from.getTime() + KST_MS);
  const endUtc = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() + days, 23, 59, 59) - KST_MS;
  return new Date(endUtc);
}

/** 승인된 영수증으로 사이드를 고를 수 있는 마지막 시각 (승인 시각 기준 couponValidDays 일 뒤 그날 끝, KST) */
export function pickDeadlineFor(receipt: Pick<Receipt, "reviewedAt" | "createdAt">, rules: Pick<Rules, "couponValidDays">): Date {
  const base = receipt.reviewedAt ?? receipt.createdAt;
  return expiresAtKst(base, rules.couponValidDays);
}

export function isPickExpired(receipt: Pick<Receipt, "reviewedAt" | "createdAt">, rules: Pick<Rules, "couponValidDays">, now: Date = new Date()): boolean {
  return now.getTime() > pickDeadlineFor(receipt, rules).getTime();
}

/** 승인된 영수증으로 다른 매장의 사이드 쿠폰 1장 발급 */
export async function issueSideCoupon(p: { memberId: string; receiptId: string; menuItemId: number; now?: Date }): Promise<Coupon> {
  const now = p.now ?? new Date();
  if (!isUuid(p.receiptId) || !Number.isInteger(p.menuItemId)) throw new CouponError("영수증을 찾을 수 없습니다.", 404);
  const receipt = await getReceipt(p.receiptId);
  if (!receipt || receipt.memberId !== p.memberId) throw new CouponError("영수증을 찾을 수 없습니다.", 404);
  if (receipt.status !== "approved") throw new CouponError("아직 승인되지 않은 영수증입니다.");
  if (receipt.couponId) throw new CouponError("이 영수증으로는 이미 쿠폰을 받았습니다.");
  if (!receipt.storeId) throw new CouponError("영수증 매장을 확인할 수 없습니다.");
  const rules = await getRules();
  if (isPickExpired(receipt, rules, now)) throw new CouponError(REASONS.PICK_EXPIRED);
  const item = await getMenuItem(p.menuItemId);
  if (!item || !item.active || !item.isGift) throw new CouponError("고를 수 없는 메뉴입니다.");
  if (!giftStoresFor(receipt.storeId).some((s) => s.id === item.storeId)) throw new CouponError("영수증을 받은 매장에서는 쿠폰을 쓸 수 없습니다. 다른 두 매장의 메뉴를 선택해 주십시오.");
  const code = await uniqueCode();
  const expires = expiresAtKst(now, rules.couponValidDays);
  const id = await tx(async (q) => {
    const locked = await q.query<{ coupon_id: string | null; status: string }>(`select coupon_id, status from receipts where id=$1 for update`, [receipt.id]);
    if (!locked[0] || locked[0].status !== "approved") throw new CouponError("아직 승인되지 않은 영수증입니다.");
    if (locked[0].coupon_id) throw new CouponError("이 영수증으로는 이미 쿠폰을 받았습니다.");
    const rows = await q.query<{ id: string }>(
      `insert into coupons (code, member_id, receipt_id, use_store_id, menu_item_id, menu_name, kind, status, issued_at, expires_at)
       values ($1,$2,$3,$4,$5,$6,'side','active',$7,$8) returning id`,
      [code, p.memberId, receipt.id, item.storeId, item.id, item.name, now.toISOString(), expires.toISOString()],
    );
    await q.query(`update receipts set coupon_id=$2 where id=$1`, [receipt.id, rows[0]!.id]);
    return rows[0]!.id;
  });
  return (await getCoupon(id))!;
}

/** 쿠폰 사용 처리 (손님 화면에서 직원 확인 후, 또는 관리자 화면에서) */
export async function redeemCoupon(p: { couponId: string; by: { memberId: string } | { adminId: string; storeId: StoreId | null } }): Promise<Coupon> {
  const c = await getCoupon(p.couponId);
  if (!c) throw new CouponError("쿠폰을 찾을 수 없습니다.", 404);
  if ("memberId" in p.by && c.memberId !== p.by.memberId) throw new CouponError("본인 쿠폰만 사용할 수 있습니다.", 403);
  if ("adminId" in p.by && p.by.storeId && p.by.storeId !== c.useStoreId) throw new CouponError(`이 쿠폰은 ${getStore(c.useStoreId)?.shortName ?? "다른 매장"} 전용입니다.`, 403);
  if (c.status === "used") throw new CouponError("이미 사용된 쿠폰입니다.");
  if (c.status === "expired") throw new CouponError("기간이 지난 쿠폰입니다.");
  if (c.status === "void") throw new CouponError("취소된 쿠폰입니다.");
  const via = "memberId" in p.by ? "customer" : `admin:${p.by.adminId}`;
  const rows = await tx(async (q) =>
    q.query<{ id: string }>(`update coupons set status='used', used_at=now(), used_via=$2 where id=$1 and status='active' and expires_at > now() returning id`, [c.id, via]),
  );
  if (!rows.length) throw new CouponError("이미 사용되었거나 기간이 지난 쿠폰입니다.");
  if ("adminId" in p.by) await audit(p.by.adminId, "coupon.redeem", c.id, { code: c.code });
  return (await getCoupon(c.id))!;
}

/** 관리자 취소. 확인과 갱신 사이에 손님이 사용해 버린 경우 덮어쓰지 않는다(상태 조건부 update). */
export async function voidCoupon(p: { couponId: string; adminId: string; note: string | null }): Promise<Coupon> {
  const c = await getCoupon(p.couponId);
  if (!c) throw new CouponError("쿠폰을 찾을 수 없습니다.", 404);
  if (c.status !== "active") throw new CouponError("사용 가능 상태의 쿠폰만 취소할 수 있습니다.");
  const rows = await tx(async (q) => q.query<{ id: string }>(`update coupons set status='void', note=$2 where id=$1 and status='active' returning id`, [c.id, p.note]));
  if (!rows.length) throw new CouponError("그 사이에 사용된 쿠폰이라 취소할 수 없습니다.");
  await audit(p.adminId, "coupon.void", c.id, { note: p.note });
  return (await getCoupon(c.id))!;
}

/** 관리자 수동 발급 (VIP 등급 일괄 또는 특정 회원) */
export async function issueManualCoupons(p: {
  adminId: string;
  target: { tierKey: string } | { memberId: string };
  useStoreId: StoreId;
  menuItemId: number | null;
  menuName: string;
  validDays: number;
  note: string | null;
  kind: "vip" | "manual";
  now?: Date;
}): Promise<number> {
  const now = p.now ?? new Date();
  let memberIds: string[] = [];
  if ("memberId" in p.target) memberIds = isUuid(p.target.memberId) ? [p.target.memberId] : [];
  else memberIds = (await listMembers({ tier: p.target.tierKey, limit: 10000 })).items.map((m) => m.id);
  if (!memberIds.length) return 0;
  const expires = expiresAtKst(now, p.validDays).toISOString();
  let n = 0;
  for (const memberId of memberIds) {
    const code = await uniqueCode();
    await tx(async (q) =>
      q.query(
        `insert into coupons (code, member_id, receipt_id, use_store_id, menu_item_id, menu_name, kind, status, issued_at, expires_at, note)
         values ($1,$2,null,$3,$4,$5,$6,'active',$7,$8,$9)`,
        [code, memberId, p.useStoreId, p.menuItemId, p.menuName, p.kind, now.toISOString(), expires, p.note],
      ),
    );
    n++;
  }
  await audit(p.adminId, "coupon.issue_manual", null, { target: p.target, useStoreId: p.useStoreId, menuName: p.menuName, count: n });
  return n;
}
