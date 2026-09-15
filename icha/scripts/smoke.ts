/**
 * DB 계층 스모크 테스트 (메모리 PGlite). `npx tsx scripts/smoke.ts`
 */
process.env.PGLITE_MEMORY = "1";
process.env.ADMIN_INITIAL_PASSWORD = "test-pw";
import assert from "node:assert/strict";
import { getDb, one } from "../src/lib/db";
import { findOrCreateMember, insertReceipt, probeDuplicates, getReceipt, listMenu, upsertMenuItem, dashboardStats, countMemberReceiptsToday, listReceipts, getAdmin, applyApprovedSpend, getMember, listCoupons } from "../src/lib/db/queries";
import { tx } from "../src/lib/db";
import { issueSideCoupon, redeemCoupon, issueManualCoupons } from "../src/lib/coupons";
import { getRules, saveRules, tierFor } from "../src/lib/settings";
import { rateLimit } from "../src/lib/rate-limit";
import { verifyPassword } from "../src/lib/auth/password";

async function main() {
  await getDb();
  const stores = await one<{ n: number }>(`select count(*)::int as n from stores`);
  assert.equal(stores?.n, 3, "stores seeded");
  const admin = await getAdmin("owner");
  assert.ok(admin && (await verifyPassword("test-pw", admin.pwHash)), "initial admin");

  const m = await findOrCreateMember("01012345678");
  const m2 = await findOrCreateMember("01012345678");
  assert.equal(m.id, m2.id);

  // 메뉴
  const id1 = await upsertMenuItem({ storeId: "tokyo", name: "오이사라다", price: 5900, description: null, isGift: true, active: true, sort: 1 });
  const id2 = await upsertMenuItem({ storeId: "joseon", name: "김치전", price: 12000, description: null, isGift: true, active: true, sort: 1 });
  const gifts = await listMenu("tokyo", { giftOnly: true });
  assert.ok(gifts.some((g) => g.id === id1));

  // 영수증
  const now = new Date();
  const image = Buffer.from("fake-jpeg-bytes");
  const rid = await tx((q) =>
    insertReceipt(q, {
      memberId: m.id, storeId: "joseon", status: "approved", reasons: [], image, imageMime: "image/jpeg",
      sha256: "a".repeat(64), dhash: "0123456789abcdef", ocr: { merchant_name: "조선칼국수", items: [] }, receiptAt: now, amount: 32000, approvalNo: "12345678", cardLast4: "1234",
    }),
  );
  await tx((q) => applyApprovedSpend(q, { memberId: m.id, storeId: "joseon", receiptId: rid, amount: 32000, tierKey: tierFor(32000, { ...DEFAULTS }).key }));
  const r = await getReceipt(rid);
  assert.ok(r && r.status === "approved" && r.amount === 32000 && r.storeId === "joseon");
  assert.deepEqual(r!.reasons, []);
  assert.equal((r!.ocr as { merchant_name: string }).merchant_name, "조선칼국수");
  assert.equal(r!.receiptAt?.getTime(), Math.floor(now.getTime() / 1000) * 1000 + (now.getMilliseconds()), "timestamptz roundtrip");
  const rid2 = await tx((q) =>
    insertReceipt(q, { memberId: m.id, storeId: null, status: "review", reasons: ["STORE_UNKNOWN", "SIMILAR_IMAGE"], image, imageMime: "image/jpeg", sha256: "b".repeat(64), dhash: "0123456789abcdee", ocr: null, receiptAt: null, amount: null, approvalNo: null, cardLast4: null }),
  );
  const r2 = await getReceipt(rid2);
  assert.deepEqual(r2!.reasons, ["STORE_UNKNOWN", "SIMILAR_IMAGE"]);
  assert.equal(await countMemberReceiptsToday(m.id, now), 2);
  const probe = await probeDuplicates({ sha256: "c".repeat(64), approvalNo: "12345678", storeId: "joseon", receiptAt: now, amount: 32000, sinceForHashes: new Date(now.getTime() - 86400000) });
  assert.equal(probe.approvalHit, true);
  assert.equal(probe.fingerprintHit, true);
  assert.equal(probe.recentHashes.length, 2);
  const lst = await listReceipts({ status: "review" });
  assert.equal(lst.total, 1);
  assert.equal(lst.items[0]!.memberPhone, "01012345678");

  // 쿠폰
  await assert.rejects(issueSideCoupon({ memberId: m.id, receiptId: rid, menuItemId: id2 }), /다른 두 매장/);
  const c = await issueSideCoupon({ memberId: m.id, receiptId: rid, menuItemId: id1 });
  assert.equal(c.useStoreId, "tokyo");
  assert.match(c.code, /^[A-Z2-9]{6}$/);
  await assert.rejects(issueSideCoupon({ memberId: m.id, receiptId: rid, menuItemId: id1 }), /이미 쿠폰/);
  await assert.rejects(redeemCoupon({ couponId: c.id, by: { adminId: "owner", storeId: "joseon" } }), /전용/);
  const used = await redeemCoupon({ couponId: c.id, by: { memberId: m.id } });
  assert.equal(used.status, "used");
  await assert.rejects(redeemCoupon({ couponId: c.id, by: { memberId: m.id } }), /이미 사용/);
  const n = await issueManualCoupons({ adminId: "owner", target: { memberId: m.id }, useStoreId: "wareureu", menuItemId: null, menuName: "사이드 1개", validDays: 7, note: "테스트", kind: "manual" });
  assert.equal(n, 1);
  const all = await listCoupons({});
  assert.equal(all.total, 2);

  // 설정
  const rules = await getRules();
  assert.equal(rules.receiptValidHours, 24);
  const saved = await saveRules({ receiptValidHours: 12 });
  assert.equal(saved.receiptValidHours, 12);
  assert.equal((await getRules()).receiptValidHours, 12);

  // 회원 누적
  const mm = await getMember(m.id);
  assert.equal(mm!.totalSpend, 32000);
  assert.equal(mm!.visitCount, 1);

  // 통계
  const stats = await dashboardStats(now);
  assert.equal(stats.today.receipts, 2);
  assert.equal(stats.members, 1);
  assert.equal(stats.recentDays.length, 14);
  assert.equal(stats.byStore.length, 3);

  // 속도 제한
  assert.equal(await rateLimit("t", 2, 60), true);
  assert.equal(await rateLimit("t", 2, 60), true);
  assert.equal(await rateLimit("t", 2, 60), false);

  // 영수증 파이프라인 (API 키 없음 → 직원 확인)
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp({ create: { width: 600, height: 900, channels: 3, background: "#fdfcf8" } }).jpeg().toBuffer();
  const { submitReceipt, adminDecideReceipt } = await import("../src/lib/receipt/service");
  const m3 = await findOrCreateMember("01099998888");
  const s1 = await submitReceipt({ memberId: m3.id, file: jpeg, now });
  assert.equal(s1.receipt.status, "review");
  assert.deepEqual(s1.receipt.reasons, ["OCR_UNAVAILABLE"]);
  const s2 = await submitReceipt({ memberId: m3.id, file: jpeg, now });
  assert.equal(s2.receipt.status, "rejected");
  assert.deepEqual(s2.receipt.reasons, ["DUPLICATE_IMAGE"]);
  const jpeg2 = await sharp({ create: { width: 640, height: 900, channels: 3, background: "#f0ede4" } }).jpeg().toBuffer();
  const s3 = await submitReceipt({ memberId: m3.id, file: jpeg2, now });
  assert.equal(s3.receipt.status, "review");
  const approved = await adminDecideReceipt({ receiptId: s1.receipt.id, approve: true, adminId: "owner", note: "확인", storeId: "wareureu", amount: 45000, receiptAt: now });
  assert.equal(approved.status, "approved");
  assert.equal(approved.storeId, "wareureu");
  const m3b = await getMember(m3.id);
  assert.equal(m3b!.totalSpend, 45000);
  const id3 = await upsertMenuItem({ storeId: "wareureu", name: "쫀득감자", price: 8900, description: null, isGift: true, active: true, sort: 1 });
  await assert.rejects(issueSideCoupon({ memberId: m3.id, receiptId: approved.id, menuItemId: id3 }), /다른 두 매장/);
  const c3 = await issueSideCoupon({ memberId: m3.id, receiptId: approved.id, menuItemId: id2 });
  assert.equal(c3.useStoreId, "joseon");
  const img = await (await import("../src/lib/db/queries")).getReceiptImage(s1.receipt.id);
  assert.ok(img && img.data.length > 100 && img.mime === "image/jpeg");
  await assert.rejects(submitReceipt({ memberId: m3.id, file: Buffer.from("not an image"), now }), /이미지를 읽을 수 없습니다/);

  console.log("SMOKE OK");
}
import { DEFAULT_RULES as DEFAULTS } from "../src/lib/config";
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
