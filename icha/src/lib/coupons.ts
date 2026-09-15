/**
 * 쿠폰 발급/사용.
 */
import { randomInt } from "node:crypto";
import type { StoreId } from "./config";
import { one, tx } from "./db";
import { audit, getCoupon, getMenuItem, getReceipt, listMembers, type Coupon } from "./db/queries";
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
  throw new CouponError("쿠폰 코드를 만들지 못했습니다. 다시 시도해 주세요.", 500);
}

/** 승인된 영수증으로 다른 매장의 사이드 쿠폰 1장 발급 */
export async function issueSideCoupon(p: { memberId: string; receiptId: string; menuItemId: number }): Promise<Coupon> {
  const receipt = await getReceipt(p.receiptId);
  if (!receipt || receipt.memberId !== p.memberId) throw new CouponError("영수증을 찾을 수 없습니다.", 404);
  if (receipt.status !== "approved") throw new CouponError("아직 승인되지 않은 영수증입니다.");
  if (receipt.couponId) throw new CouponError("이 영수증으로는 이미 쿠폰을 받았습니다.");
  if (!receipt.storeId) throw new CouponError("영수증 매장을 확인할 수 없습니다.");
  const item = await getMenuItem(p.menuItemId);
  if (!item || !item.active || !item.isGift) throw new CouponError("고를 수 없는 메뉴입니다.");
  if (!giftStoresFor(receipt.storeId).some((s) => s.id === item.storeId)) throw new CouponError("영수증을 받은 매장에서는 쿠폰을 쓸 수 없습니다. 다른 두 매장의 메뉴를 골라 주세요.");
  const rules = await getRules();
  const code = await uniqueCode();
  const expires = new Date(Date.now() + rules.couponValidDays * 86400 * 1000);
  const id = await tx(async (q) => {
    const locked = await q.query<{ coupon_id: string | null }>(`select coupon_id from receipts where id=$1 for update`, [receipt.id]);
    if (locked[0]?.coupon_id) throw new CouponError("이 영수증으로는 이미 쿠폰을 받았습니다.");
    const rows = await q.query<{ id: string }>(
      `insert into coupons (code, member_id, receipt_id, use_store_id, menu_item_id, menu_name, kind, status, expires_at)
       values ($1,$2,$3,$4,$5,$6,'side','active',$7) returning id`,
      [code, p.memberId, receipt.id, item.storeId, item.id, item.name, expires.toISOString()],
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

export async function voidCoupon(p: { couponId: string; adminId: string; note: string | null }): Promise<Coupon> {
  const c = await getCoupon(p.couponId);
  if (!c) throw new CouponError("쿠폰을 찾을 수 없습니다.", 404);
  if (c.status !== "active") throw new CouponError("사용 가능 상태의 쿠폰만 취소할 수 있습니다.");
  await tx(async (q) => q.query(`update coupons set status='void', note=$2 where id=$1`, [c.id, p.note]));
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
}): Promise<number> {
  let memberIds: string[] = [];
  if ("memberId" in p.target) memberIds = [p.target.memberId];
  else memberIds = (await listMembers({ tier: p.target.tierKey, limit: 10000 })).items.map((m) => m.id);
  if (!memberIds.length) return 0;
  const expires = new Date(Date.now() + p.validDays * 86400 * 1000).toISOString();
  let n = 0;
  for (const memberId of memberIds) {
    const code = await uniqueCode();
    await tx(async (q) =>
      q.query(
        `insert into coupons (code, member_id, receipt_id, use_store_id, menu_item_id, menu_name, kind, status, expires_at, note)
         values ($1,$2,null,$3,$4,$5,$6,'active',$7,$8)`,
        [code, memberId, p.useStoreId, p.menuItemId, p.menuName, p.kind, expires, p.note],
      ),
    );
    n++;
  }
  await audit(p.adminId, "coupon.issue_manual", null, { target: p.target, useStoreId: p.useStoreId, menuName: p.menuName, count: n });
  return n;
}
