/**
 * 손님 흐름 시연 데이터 — 사진 없이, 카운터 발급 형태(sha256 'counter:<uuid>', reasons ['COUNTER'])의 승인 영수증과 쿠폰들.
 *  회원 01012345678: 받은 쿠폰(아직 안 고름) 1건, 쓸 수 있는 쿠폰 2장(매장 다름), 사용/만료/취소 쿠폰.
 * 파일 DB 를 쓰는 dev 서버와 같은 PGLITE_DIR 로 실행한다(서버를 잠시 내린 뒤; PGlite 파일 DB 는 한 프로세스만 연다).
 *   PGLITE_DIR=/path/to/pg npx tsx scripts/demo-flow.ts
 * 결과로 화면 확인에 쓸 id 들을 JSON 으로 출력한다. DEMO_OUT=<파일> 이면 같은 JSON 을 그 파일에도 쓴다.
 * DEMO_ADD_PICKABLE=1 이면 아직 안 고른 승인 영수증 한 건만 더 넣는다(/pick 재확인용).
 */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { getDb, query, tx } from "../src/lib/db";
import { applyApprovedSpend, findOrCreateMember, getMember, listMenu, upsertMenuItem, type MenuItem } from "../src/lib/db/queries";
import { issueManualCoupons, issueSideCoupon, redeemCoupon, voidCoupon } from "../src/lib/coupons";
import { getRules } from "../src/lib/settings";
import { giftStoresFor } from "../src/lib/stores";
import type { StoreId } from "../src/lib/config";

const PHONE = process.env.DEMO_PHONE ?? "01012345678";
const ADMIN = "owner";

/** 증정 품목이 비어 있는 매장에만 넣는 시연용 혜택 (사장님 데이터가 들어오면 그쪽이 우선) */
const DEMO_GIFTS: Record<StoreId, { name: string; price: number; description: string }[]> = {
  joseon: [{ name: "조선막걸리 2통 1반", price: 11500, description: "막걸리 2통에 사이다 1병을 섞어 큰 사발에" }],
  tokyo: [{ name: "산토리 프리미엄 생맥주", price: 8900, description: "퍼펙트 푸어링 크리미 거품" }],
  wareureu: [{ name: "와르르요거트(초코쉘)", price: 6500, description: "요거트 아이스크림" }, { name: "소주 1병", price: 5000, description: "좋은데이·진로 중 선택" }],
};

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600 * 1000);
}

async function ensureGifts(storeId: StoreId): Promise<MenuItem[]> {
  let items = await listMenu(storeId, { giftOnly: true });
  if (items.length) return items;
  let sort = (await listMenu(storeId, { includeInactive: true })).length;
  for (const g of DEMO_GIFTS[storeId]) {
    await upsertMenuItem({ storeId, name: g.name, price: g.price, description: g.description, isGift: true, active: true, sort: sort++ });
  }
  items = await listMenu(storeId, { giftOnly: true });
  console.error(`[demo] ${storeId}: 증정 품목이 없어 시연용 혜택 ${items.length}개를 넣었습니다.`);
  return items;
}

/** 카운터 발급과 같은 모양의 승인 영수증 (src/lib/counter.ts issueCounterPass 와 같은 컬럼) — 시각만 과거로 둘 수 있다 */
async function counterReceipt(memberId: string, storeId: StoreId, at: Date, amount: number | null = null): Promise<string> {
  const rules = await getRules();
  return tx(async (q) => {
    const rows = await q.query<{ id: string }>(
      `insert into receipts (member_id, store_id, status, reasons, sha256, receipt_at, amount, created_at, reviewed_at, reviewed_by, review_note)
       values ($1,$2,'approved',$3,$4,$5,$6,$5,$5,$7,$8) returning id`,
      [memberId, storeId, ["COUNTER"], `counter:${randomUUID()}`, at.toISOString(), amount, ADMIN, "카운터 발급"],
    );
    const id = rows[0]!.id;
    await applyApprovedSpend(q, { memberId, storeId, receiptId: id, amount, rules });
    return id;
  });
}

async function main() {
  await getDb();
  const member = await findOrCreateMember(PHONE);

  // 추가 모드: 아직 어디서 쓸지 안 고른 승인 영수증 한 건만 더 넣는다 (/pick 화면 재확인용)
  if (process.env.DEMO_ADD_PICKABLE === "1") {
    const id = await counterReceipt(member.id, "joseon", hoursAgo(0.5));
    console.log(JSON.stringify({ pickable: id }));
    return;
  }
  const already = await query<{ n: number }>(`select count(*)::int as n from receipts where member_id=$1`, [member.id]);
  if ((already[0]?.n ?? 0) > 0) {
    console.error("[demo] 이미 시연 데이터가 있습니다. 초기화하려면 PGLITE_DIR 폴더를 지우고 다시 실행하십시오.");
  }

  const gifts = { joseon: await ensureGifts("joseon"), tokyo: await ensureGifts("tokyo"), wareureu: await ensureGifts("wareureu") };
  const pickGift = (receiptStore: StoreId, i: number): MenuItem => {
    const target = giftStoresFor(receiptStore)[i % 2]!.id;
    const item = gifts[target][0];
    if (!item) throw new Error(`${target} 에 증정 품목이 없습니다`);
    return item;
  };

  // 0) 지난달부터 쌓인 릴레이 세 건 (쿠폰은 모두 사용)
  const olds: [StoreId, number][] = [["joseon", 24 * 26], ["wareureu", 24 * 19], ["tokyo", 24 * 11]];
  for (const [sid, h] of olds) {
    const rid = await counterReceipt(member.id, sid, hoursAgo(h));
    const c = await issueSideCoupon({ memberId: member.id, receiptId: rid, menuItemId: pickGift(sid, h % 2).id });
    await query(`update coupons set issued_at=$2 where id=$1`, [c.id, hoursAgo(h - 1).toISOString()]);
    await redeemCoupon({ couponId: c.id, by: { memberId: member.id } });
    await query(`update coupons set used_at=$2 where id=$1`, [c.id, hoursAgo(h - 20).toISOString()]);
  }

  // 1) 조선칼국수 카운터(어제) → 도쿄스탠드 쿠폰, 이미 사용
  const r1 = await counterReceipt(member.id, "joseon", hoursAgo(30));
  const c1 = await issueSideCoupon({ memberId: member.id, receiptId: r1, menuItemId: pickGift("joseon", 0).id });
  await query(`update coupons set issued_at=$2 where id=$1`, [c1.id, hoursAgo(29).toISOString()]);
  await redeemCoupon({ couponId: c1.id, by: { memberId: member.id } });
  await query(`update coupons set used_at=$2 where id=$1`, [c1.id, hoursAgo(27).toISOString()]);

  // 2) 도쿄스탠드 카운터(오늘) → 와르르맨숀 쿠폰, 사용 가능
  const r2 = await counterReceipt(member.id, "tokyo", hoursAgo(3));
  const c2 = await issueSideCoupon({ memberId: member.id, receiptId: r2, menuItemId: pickGift("tokyo", 1).id });

  // 3) 와르르맨숀 카운터(방금), 아직 어디서 쓸지 안 고름 → 쿠폰함 "받은 쿠폰" + /pick 시연
  const r3 = await counterReceipt(member.id, "wareureu", hoursAgo(1));

  // 4) 만료된 쿠폰 (매장 발급, 유효기간 지남)
  await issueManualCoupons({ adminId: ADMIN, target: { memberId: member.id }, useStoreId: "joseon", menuItemId: gifts.joseon[0]?.id ?? null, menuName: gifts.joseon[0]?.name ?? "막걸리 한 잔", validDays: 1, note: "오픈 기념", kind: "manual" });
  const expiredRow = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='manual' order by issued_at desc limit 1`, [member.id]);
  const c3 = expiredRow[0]!.id;
  await query(`update coupons set issued_at=$2, expires_at=$3 where id=$1`, [c3, hoursAgo(24 * 20).toISOString(), hoursAgo(24 * 19).toISOString()]);

  // 5) 매장이 따로 넣어 준 쿠폰 (사용 가능, 도쿄스탠드)
  await issueManualCoupons({ adminId: ADMIN, target: { memberId: member.id }, useStoreId: "tokyo", menuItemId: gifts.tokyo[0]?.id ?? null, menuName: gifts.tokyo[0]?.name ?? "생맥주 한 잔", validDays: 14, note: "단골 감사 쿠폰", kind: "manual" });
  const manualRow = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='manual' and status='active' and use_store_id='tokyo' order by issued_at desc limit 1`, [member.id]);
  const c4 = manualRow[0]!.id;

  // 6) 취소된 쿠폰
  await issueManualCoupons({ adminId: ADMIN, target: { memberId: member.id }, useStoreId: "wareureu", menuItemId: gifts.wareureu[0]?.id ?? null, menuName: gifts.wareureu[0]?.name ?? "소주 한 잔", validDays: 7, note: null, kind: "manual" });
  const voidRow = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='manual' and status='active' and use_store_id='wareureu' order by issued_at desc limit 1`, [member.id]);
  const c5 = await voidCoupon({ couponId: voidRow[0]!.id, adminId: ADMIN, note: "직원 착오로 이중 발급" });

  const m = (await getMember(member.id))!;
  const out = JSON.stringify({
    phone: PHONE, memberId: member.id, visitCount: m.visitCount,
    receipts: { usedCoupon: r1, activeCoupon: r2, pickable: r3 },
    coupons: { used: c1.id, active: c2.id, expired: c3, manual: c4, void: c5.id },
  }, null, 2);
  console.log(out);
  if (process.env.DEMO_OUT) writeFileSync(process.env.DEMO_OUT, out);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
