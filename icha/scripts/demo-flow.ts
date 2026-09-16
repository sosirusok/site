/**
 * 손님 흐름 시연 데이터 — 회원(01012345678, VIP), 승인(아직 안 고름)/대기/반려 영수증, 사용 가능 2장(매장 다름)/사용/만료/취소 쿠폰.
 * 파일 DB 를 쓰는 dev 서버와 같은 PGLITE_DIR 로 실행한다(서버를 잠시 내린 뒤; PGlite 파일 DB 는 한 프로세스만 연다).
 *   PGLITE_DIR=/path/to/pg npx tsx scripts/demo-flow.ts
 * 결과로 화면 확인에 쓸 id 들을 JSON 으로 출력한다. DEMO_OUT=<파일> 이면 같은 JSON 을 그 파일에도 쓴다.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { getDb, query, tx } from "../src/lib/db";
import { applyApprovedSpend, findOrCreateMember, getMember, insertReceipt, listMenu, upsertMenuItem, type MenuItem } from "../src/lib/db/queries";
import { issueManualCoupons, issueSideCoupon, redeemCoupon, voidCoupon } from "../src/lib/coupons";
import { getRules, tierFor } from "../src/lib/settings";
import { STORE_BY_ID, giftStoresFor } from "../src/lib/stores";
import type { StoreId } from "../src/lib/config";
import { computeDHash } from "../src/lib/receipt/image";

const PHONE = process.env.DEMO_PHONE ?? "01012345678";

/** 증정 품목이 비어 있는 매장에만 넣는 시연용 술 한 잔 (사장님 데이터가 들어오면 그쪽이 우선) */
const DEMO_GIFTS: Record<StoreId, { name: string; price: number; description: string }[]> = {
  joseon: [{ name: "조선막걸리 1통", price: 6000, description: "양은 통에 담아 내는 막걸리." }],
  tokyo: [{ name: "산토리 생맥주 1잔", price: 8900, description: "산토리 크리미 생맥주 한 잔." }],
  wareureu: [{ name: "소주 1병", price: 5000, description: "소주 한 병." }],
};

async function receiptImage(storeName: string, amount: number, when: string, approval: string): Promise<{ buf: Buffer; sha: string; dhash: string }> {
  const lines = [
    storeName, "부산 부산진구 서면", "-----------------------------",
    `거래일시  ${when}`, `승인번호  ${approval}`, `카드번호  ****-****-****-4321`, "-----------------------------",
    `합    계  ${amount.toLocaleString("ko-KR")}원`, "감사합니다",
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="${140 + lines.length * 48}">
    <rect width="100%" height="100%" fill="#fbf8f1"/>
    ${lines.map((l, i) => `<text x="40" y="${100 + i * 48}" font-family="WenQuanYi Zen Hei, monospace" font-size="28" fill="#1a1714">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`).join("")}
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
  return { buf, sha: createHash("sha256").update(buf).digest("hex"), dhash: await computeDHash(buf) };
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600 * 1000);
}
function kst(d: Date): string {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, "0")}-${String(k.getUTCDate()).padStart(2, "0")} ${String(k.getUTCHours()).padStart(2, "0")}:${String(k.getUTCMinutes()).padStart(2, "0")}`;
}

async function ensureGifts(storeId: StoreId): Promise<MenuItem[]> {
  let items = await listMenu(storeId, { giftOnly: true });
  if (items.length) return items;
  let sort = (await listMenu(storeId, { includeInactive: true })).length;
  for (const g of DEMO_GIFTS[storeId]) {
    await upsertMenuItem({ storeId, name: g.name, price: g.price, description: g.description, isGift: true, active: true, sort: sort++ });
  }
  items = await listMenu(storeId, { giftOnly: true });
  console.error(`[demo] ${storeId}: 증정 품목이 없어 시연용 술 ${items.length}개를 넣었습니다.`);
  return items;
}

async function approvedReceipt(memberId: string, storeId: StoreId, amount: number, at: Date, approval: string): Promise<string> {
  const img = await receiptImage(STORE_BY_ID[storeId].name, amount, kst(at), approval);
  const rules = await getRules();
  const member = (await getMember(memberId))!;
  return tx(async (q) => {
    const id = await insertReceipt(q, {
      memberId, storeId, status: "approved", reasons: [], image: img.buf, imageMime: "image/jpeg", sha256: img.sha, dhash: img.dhash,
      ocr: { merchant_name: STORE_BY_ID[storeId].name, paid_at: kst(at).replace(" ", "T") + ":00", total_amount: amount, approval_number: approval, items: [] },
      receiptAt: at, amount, approvalNo: approval, cardLast4: "4321",
    });
    await applyApprovedSpend(q, { memberId, storeId, receiptId: id, amount, tierKey: tierFor(member.totalSpend + amount, rules).key });
    return id;
  });
}

async function main() {
  await getDb();
  const member = await findOrCreateMember(PHONE);

  // 추가 모드: 아직 메뉴를 고르지 않은 승인 영수증 한 장만 더 넣는다 (/pick 화면 재확인용)
  if (process.env.DEMO_ADD_PICKABLE === "1") {
    const amount = 12000 + Math.floor(Math.random() * 40) * 1000;
    const id = await approvedReceipt(member.id, "joseon", amount, hoursAgo(0.5), String(30200000 + Math.floor(Math.random() * 99999)));
    console.log(JSON.stringify({ pickable: id, amount }));
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

  // 0) 지난달부터 쌓인 영수증 세 장 (쿠폰은 모두 사용) — 누적 금액이 VIP 기준을 넘도록
  const olds: [StoreId, number, number, string][] = [["joseon", 96000, 24 * 26, "29811001"], ["wareureu", 88000, 24 * 19, "29855210"], ["tokyo", 64000, 24 * 11, "29901880"]];
  for (const [sid, amt, h, ap] of olds) {
    const rid = await approvedReceipt(member.id, sid, amt, hoursAgo(h), ap);
    const c = await issueSideCoupon({ memberId: member.id, receiptId: rid, menuItemId: pickGift(sid, h % 2).id });
    await query(`update coupons set issued_at=$2 where id=$1`, [c.id, hoursAgo(h - 1).toISOString()]);
    await redeemCoupon({ couponId: c.id, by: { memberId: member.id } });
    await query(`update coupons set used_at=$2 where id=$1`, [c.id, hoursAgo(h - 20).toISOString()]);
  }

  // 1) 조선칼국수 영수증(어제) → 도쿄스탠드 쿠폰, 이미 사용
  const r1 = await approvedReceipt(member.id, "joseon", 32000, hoursAgo(30), "30112345");
  const c1 = await issueSideCoupon({ memberId: member.id, receiptId: r1, menuItemId: pickGift("joseon", 0).id });
  await query(`update coupons set issued_at=$2 where id=$1`, [c1.id, hoursAgo(29).toISOString()]);
  await redeemCoupon({ couponId: c1.id, by: { memberId: member.id } });
  await query(`update coupons set used_at=$2 where id=$1`, [c1.id, hoursAgo(27).toISOString()]);

  // 2) 도쿄스탠드 영수증(오늘) → 와르르맨숀 쿠폰, 사용 가능
  const r2 = await approvedReceipt(member.id, "tokyo", 41000, hoursAgo(3), "30167890");
  const c2 = await issueSideCoupon({ memberId: member.id, receiptId: r2, menuItemId: pickGift("tokyo", 1).id });

  // 3) 와르르맨숀 영수증(방금) 승인, 아직 안 고름 → /pick 시연
  const r3 = await approvedReceipt(member.id, "wareureu", 18000, hoursAgo(1), "30199001");

  // 4) 직원 확인 대기 (자동 인식 불가)
  const img4 = await receiptImage("(읽지 못한 영수증)", 0, kst(hoursAgo(0.2)), "-");
  const r4 = await tx((q) =>
    insertReceipt(q, {
      memberId: member.id, storeId: null, status: "review", reasons: ["OCR_UNAVAILABLE"], image: img4.buf, imageMime: "image/jpeg",
      sha256: img4.sha, dhash: img4.dhash, ocr: null, receiptAt: null, amount: null, approvalNo: null, cardLast4: null,
    }),
  );

  // 5) 반려 (인정 시간 초과)
  const img5 = await receiptImage(STORE_BY_ID.joseon.name, 25000, kst(hoursAgo(50)), "29988776");
  const r5 = await tx((q) =>
    insertReceipt(q, {
      memberId: member.id, storeId: "joseon", status: "rejected", reasons: ["EXPIRED"], image: img5.buf, imageMime: "image/jpeg",
      sha256: img5.sha, dhash: img5.dhash, ocr: null, receiptAt: hoursAgo(50), amount: 25000, approvalNo: "29988776", cardLast4: "4321",
    }),
  );

  // 6) 만료된 쿠폰 (매장 발급, 유효기간 지남)
  await issueManualCoupons({ adminId: "owner", target: { memberId: member.id }, useStoreId: "joseon", menuItemId: gifts.joseon[0]?.id ?? null, menuName: gifts.joseon[0]?.name ?? "막걸리 한 잔", validDays: 1, note: "오픈 기념", kind: "manual" });
  const expiredRow = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='manual' order by issued_at desc limit 1`, [member.id]);
  const c3 = expiredRow[0]!.id;
  await query(`update coupons set issued_at=$2, expires_at=$3 where id=$1`, [c3, hoursAgo(24 * 20).toISOString(), hoursAgo(24 * 19).toISOString()]);

  // 7) 등급 혜택 쿠폰 (사용 가능)
  await issueManualCoupons({ adminId: "owner", target: { memberId: member.id }, useStoreId: "tokyo", menuItemId: gifts.tokyo[0]?.id ?? null, menuName: gifts.tokyo[0]?.name ?? "생맥주 한 잔", validDays: 14, note: "단골 감사 쿠폰", kind: "vip" });
  const vipRow = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='vip' order by issued_at desc limit 1`, [member.id]);
  const c4 = vipRow[0]!.id;

  // 8) 취소된 쿠폰
  await issueManualCoupons({ adminId: "owner", target: { memberId: member.id }, useStoreId: "wareureu", menuItemId: gifts.wareureu[0]?.id ?? null, menuName: gifts.wareureu[0]?.name ?? "소주 한 잔", validDays: 7, note: null, kind: "manual" });
  const voidRow = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='manual' and status='active' order by issued_at desc limit 1`, [member.id]);
  const c5 = await voidCoupon({ couponId: voidRow[0]!.id, adminId: "owner", note: "직원 착오로 이중 발급" });

  const m = (await getMember(member.id))!;
  const out = JSON.stringify({
    phone: PHONE, memberId: member.id, totalSpend: m.totalSpend, visitCount: m.visitCount, tier: m.tier,
    receipts: { usedCoupon: r1, activeCoupon: r2, pickable: r3, review: r4, rejected: r5 },
    coupons: { used: c1.id, active: c2.id, expired: c3, vip: c4, void: c5.id },
  }, null, 2);
  console.log(out);
  if (process.env.DEMO_OUT) writeFileSync(process.env.DEMO_OUT, out);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
