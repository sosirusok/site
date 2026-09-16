/**
 * 카운터 발급 — 영수증 사진 대신, 계산할 때 직원이 손님 휴대폰 번호로 "릴레이 쿠폰"을 넣어 준다.
 *  1) A 매장 직원: 번호 입력 → 승인된 영수증 한 건이 생긴다(사진 없음). 손님 쿠폰함에 "A에서 받은 쿠폰 · B/C 중 고르기"로 보인다.
 *  2) B 매장 직원: 번호 입력 → 그 손님의 미사용 릴레이(다른 매장 발급)나 B 쿠폰을 보고, B 혜택을 골라 바로 사용 처리한다.
 *  손님이 쿠폰함에서 미리 골라 두면(issueSideCoupon) 직원은 쿠폰만 사용 처리하면 된다.
 */
import { randomUUID } from "node:crypto";
import { normalizePhone, type StoreId } from "./config";
import { one, query, tx } from "./db";
import { applyApprovedSpend, audit, findOrCreateMember, getMemberByPhone, listCouponsForMember, listReceiptsForMember, type Coupon, type Member, type Receipt } from "./db/queries";
import { CouponError, isPickExpired, issueSideCoupon, redeemCoupon } from "./coupons";
import { getRules } from "./settings";
import { giftStoresFor } from "./stores";

export type CounterIssueResult = { member: Member; receiptId: string; usableAt: StoreId[] };

/** A 매장 카운터에서 손님 번호로 릴레이 쿠폰(승인 영수증) 발급 */
export async function issueCounterPass(p: { phone: string; storeId: StoreId; amount?: number | null; adminId: string; note?: string }): Promise<CounterIssueResult> {
  const phone = normalizePhone(p.phone);
  if (!phone) throw new CouponError("휴대폰 번호를 확인해 주세요.");
  const rules = await getRules();
  if (!rules.eventActive) throw new CouponError("지금은 이벤트 기간이 아니에요.");
  const member = await findOrCreateMember(phone);
  const today = await query<{ n: number }>(
    `select count(*)::int as n from receipts where member_id=$1 and store_id=$2 and status='approved' and created_at > now() - interval '1 day'`,
    [member.id, p.storeId],
  );
  if ((today[0]?.n ?? 0) >= rules.dailyLimitPerMember) throw new CouponError(`이 번호는 오늘 ${rules.dailyLimitPerMember}장까지만 받을 수 있어요.`);
  const now = new Date();
  const receiptId = await tx(async (q) => {
    const rows = await q.query<{ id: string }>(
      `insert into receipts (member_id, store_id, status, reasons, sha256, receipt_at, amount, reviewed_at, reviewed_by, review_note)
       values ($1,$2,'approved',$3,$4,$5,$6,$5,$7,$8) returning id`,
      [member.id, p.storeId, ["COUNTER"], `counter:${randomUUID()}`, now.toISOString(), p.amount ?? null, p.adminId, p.note ?? "카운터 발급"],
    );
    const id = rows[0]!.id;
    await applyApprovedSpend(q, { memberId: member.id, storeId: p.storeId, receiptId: id, amount: p.amount ?? null, rules });
    return id;
  });
  await audit(p.adminId, "counter_issue", receiptId, { phone: member.phone, storeId: p.storeId, amount: p.amount ?? null }).catch(() => {});
  return { member, receiptId, usableAt: giftStoresFor(p.storeId).map((s) => s.id) };
}

export type CounterState = {
  member: Member | null;
  /** 아직 안 고른 릴레이(다른 매장에서 발급, 이 매장에서 쓸 수 있음) */
  pending: Receipt[];
  /** 이 매장에서 쓸 수 있는 쿠폰 */
  usableHere: Coupon[];
  /** 최근 사용/발급 이력(간단) */
  recent: Coupon[];
};

/** B 매장 카운터에서 손님 번호 조회 */
export async function counterState(phone: string, storeId: StoreId | null): Promise<CounterState> {
  const normalized = normalizePhone(phone);
  const member = normalized ? await getMemberByPhone(normalized) : null;
  if (!member) return { member: null, pending: [], usableHere: [], recent: [] };
  const rules = await getRules();
  const receipts = await listReceiptsForMember(member.id, 50);
  const pending = receipts.filter((r) => r.status === "approved" && !r.couponId && r.storeId && r.storeId !== storeId && !isPickExpired(r, rules));
  const coupons = await listCouponsForMember(member.id);
  const usableHere = coupons.filter((c) => c.status === "active" && (storeId == null || c.useStoreId === storeId) && new Date(c.expiresAt).getTime() > Date.now());
  const recent = coupons.filter((c) => c.status !== "active").slice(0, 5);
  return { member, pending, usableHere, recent };
}

/** B 매장 카운터에서 릴레이를 이 매장 혜택으로 바꿔 바로 사용 처리 */
export async function counterRedeemPending(p: { receiptId: string; memberId: string; menuItemId: number; adminId: string; storeId: StoreId }): Promise<Coupon> {
  const coupon = await issueSideCoupon({ memberId: p.memberId, receiptId: p.receiptId, menuItemId: p.menuItemId });
  if (coupon.useStoreId !== p.storeId) throw new CouponError("이 매장 혜택이 아니에요.");
  return redeemCoupon({ couponId: coupon.id, by: { adminId: p.adminId, storeId: p.storeId } });
}

export async function memberPhoneExists(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  return normalized ? Boolean(await one(`select 1 from members where phone=$1`, [normalized])) : false;
}
