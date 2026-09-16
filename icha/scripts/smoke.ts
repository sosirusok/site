/**
 * DB 계층 스모크 테스트 (메모리 PGlite). `PGLITE_MEMORY=1 npx tsx scripts/smoke.ts`
 * 규칙 단위 테스트(rules.test.ts)가 못 보는 것 — 트랜잭션·잠금·유니크 인덱스·한도 재검사 — 를 실제 SQL 로 확인한다.
 */
process.env.PGLITE_MEMORY = "1";
process.env.ADMIN_INITIAL_PASSWORD = "test-pw";
import assert from "node:assert/strict";
import { getDb, one, query, tx } from "../src/lib/db";
import {
  findOrCreateMember, insertReceipt, probeDuplicates, getReceipt, listMenu, upsertMenuItem, dashboardStats, countMemberReceiptsToday, listReceipts, getAdmin,
  applyApprovedSpend, getMember, listCoupons, getReceiptImage, purgeOldData, setMenuImage, getMenuItem, menuImageUrl, isUuid,
} from "../src/lib/db/queries";
import { issueSideCoupon, redeemCoupon, issueManualCoupons, voidCoupon, expiresAtKst } from "../src/lib/coupons";
import { getRules, saveRules } from "../src/lib/settings";
import { rateLimit } from "../src/lib/rate-limit";
import { verifyPassword } from "../src/lib/auth/password";
import { DEFAULT_RULES } from "../src/lib/config";

async function main() {
  await getDb();
  const stores = await one<{ n: number }>(`select count(*)::int as n from stores`);
  assert.equal(stores?.n, 3, "stores seeded");
  const tokyoBiz = await one<{ biz_no: string | null }>(`select biz_no from stores where id='tokyo'`);
  assert.equal(tokyoBiz?.biz_no, "307-18-15409", "biz_no seeded/updated");
  const admin = await getAdmin("owner");
  assert.ok(admin && (await verifyPassword("test-pw", admin.pwHash)), "initial admin");
  const idx = await query<{ indexname: string }>(`select indexname from pg_indexes where tablename='receipts'`);
  assert.ok(idx.some((i) => i.indexname === "receipts_approval_store_live_uq"), "store-scoped approval index");
  assert.ok(!idx.some((i) => i.indexname === "receipts_approval_live_uq"), "old global approval index dropped");

  const m = await findOrCreateMember("01012345678");
  const m2 = await findOrCreateMember("01012345678");
  assert.equal(m.id, m2.id);
  assert.equal(await getMember("not-a-uuid"), null, "non-uuid id → null, not a pg error");
  assert.equal(isUuid(m.id), true);

  // 메뉴 + 사진 버전
  const id1 = await upsertMenuItem({ storeId: "tokyo", name: "오이사라다", price: 5900, description: null, isGift: true, active: true, sort: 1 });
  const id2 = await upsertMenuItem({ storeId: "joseon", name: "김치전", price: 12000, description: null, isGift: true, active: true, sort: 1 });
  const gifts = await listMenu("tokyo", { giftOnly: true });
  assert.ok(gifts.some((g) => g.id === id1));
  assert.equal(menuImageUrl((await getMenuItem(id1))!), `/api/menu-image/${id1}`);
  await setMenuImage(id1, Buffer.from("x"), "image/jpeg");
  const withImg = (await getMenuItem(id1))!;
  assert.ok(withImg.imageUpdatedAt && menuImageUrl(withImg).includes("?v="), "image url carries version after upload");
  const potato = await one<{ image_path: string | null }>(`select image_path from menu_items where store_id='wareureu' and name='와르르 쫀득감자'`);
  assert.equal(potato?.image_path, "/images/stores/wareureu/potato-balls.jpg", "potato image seeded");

  // 영수증
  const now = new Date();
  const image = Buffer.from("fake-jpeg-bytes");
  const rid = await tx((q) =>
    insertReceipt(q, {
      memberId: m.id, storeId: "joseon", status: "approved", reasons: [], image, imageMime: "image/jpeg",
      sha256: "a".repeat(64), dhash: "0123456789abcdef", ocr: { merchant_name: "조선칼국수", items: [] }, receiptAt: now, amount: 32000, approvalNo: "12345678", cardLast4: "1234",
    }),
  );
  await tx((q) => applyApprovedSpend(q, { memberId: m.id, storeId: "joseon", receiptId: rid, amount: 32000, rules: DEFAULT_RULES }));
  // 같은 영수증으로 두 번 반영해도 원장은 한 번만
  await tx((q) => applyApprovedSpend(q, { memberId: m.id, storeId: "joseon", receiptId: rid, amount: 32000, rules: DEFAULT_RULES }));
  assert.equal((await getMember(m.id))!.totalSpend, 32000, "ledger idempotent per receipt");
  const r = await getReceipt(rid);
  assert.ok(r && r.status === "approved" && r.amount === 32000 && r.storeId === "joseon" && r.hasImage);
  assert.deepEqual(r!.reasons, []);
  assert.equal((r!.ocr as { merchant_name: string }).merchant_name, "조선칼국수");
  const rid2 = await tx((q) =>
    insertReceipt(q, { memberId: m.id, storeId: null, status: "review", reasons: ["STORE_UNKNOWN", "SIMILAR_IMAGE"], image, imageMime: "image/jpeg", sha256: "b".repeat(64), dhash: "0123456789abcdee", ocr: null, receiptAt: null, amount: null, approvalNo: null, cardLast4: null }),
  );
  const r2 = await getReceipt(rid2);
  assert.deepEqual(r2!.reasons, ["STORE_UNKNOWN", "SIMILAR_IMAGE"]);
  assert.equal(await countMemberReceiptsToday(m.id, now), 2);

  // 승인번호 중복은 매장 단위
  const probeSame = await probeDuplicates({ sha256: "c".repeat(64), approvalNo: "12345678", storeId: "joseon", receiptAt: now, amount: 32000, sinceForHashes: new Date(now.getTime() - 86400000) });
  assert.equal(probeSame.approvalHit, true, "same store same approval → hit");
  assert.equal(probeSame.fingerprintHit, true);
  assert.equal(probeSame.recentHashes.length, 2);
  const probeOther = await probeDuplicates({ sha256: "c".repeat(64), approvalNo: "12345678", storeId: "tokyo", receiptAt: now, amount: 32000, sinceForHashes: now, withHashes: false });
  assert.equal(probeOther.approvalHit, false, "other store same approval → not a duplicate");
  assert.equal(probeOther.recentHashes.length, 0, "withHashes:false skips hash scan");
  const probeUnknown = await probeDuplicates({ sha256: "c".repeat(64), approvalNo: "12345678", storeId: null, receiptAt: null, amount: null, sinceForHashes: now, withHashes: false });
  assert.equal(probeUnknown.approvalHit, true, "store unknown + same approval → hit (conservative)");
  // 다른 매장의 같은 승인번호는 유니크 인덱스에도 걸리지 않는다
  const ridTokyo = await tx((q) =>
    insertReceipt(q, { memberId: m.id, storeId: "tokyo", status: "approved", reasons: [], image, imageMime: "image/jpeg", sha256: "d".repeat(64), dhash: "0123456789abcdaa", ocr: null, receiptAt: now, amount: 20000, approvalNo: "12345678", cardLast4: null }),
  );
  assert.ok(ridTokyo);
  await assert.rejects(
    tx((q) => insertReceipt(q, { memberId: m.id, storeId: "joseon", status: "review", reasons: [], image, imageMime: "image/jpeg", sha256: "e".repeat(64), dhash: "0123456789abcdab", ocr: null, receiptAt: now, amount: 20000, approvalNo: "12345678", cardLast4: null })),
    (e: { code?: string; constraint?: string }) => e.code === "23505" && e.constraint === "receipts_approval_store_live_uq",
    "same store same approval → unique violation with new constraint name",
  );
  const lst = await listReceipts({ status: "review" });
  assert.equal(lst.total, 1);
  assert.equal(lst.items[0]!.memberPhone, "01012345678");
  const staffList = await listReceipts({ storeIdOrNull: "tokyo" });
  assert.ok(staffList.items.every((x) => x.storeId === "tokyo" || x.storeId === null), "staff list: own store + unknown store");
  assert.ok(staffList.items.some((x) => x.storeId === null));

  // 쿠폰
  await assert.rejects(issueSideCoupon({ memberId: m.id, receiptId: "abc", menuItemId: id1 }), /찾을 수 없습니다/);
  await assert.rejects(issueSideCoupon({ memberId: m.id, receiptId: rid, menuItemId: id2 }), /다른 두 매장/);
  const c = await issueSideCoupon({ memberId: m.id, receiptId: rid, menuItemId: id1 });
  assert.equal(c.useStoreId, "tokyo");
  assert.match(c.code, /^[A-Z2-9]{6}$/);
  const kstExp = new Date(c.expiresAt.getTime() + 9 * 3600 * 1000);
  assert.equal(`${kstExp.getUTCHours()}:${kstExp.getUTCMinutes()}:${kstExp.getUTCSeconds()}`, "23:59:59", "expires at end of KST day");
  assert.equal(c.expiresAt.getTime(), expiresAtKst(c.issuedAt, 30).getTime());
  await assert.rejects(issueSideCoupon({ memberId: m.id, receiptId: rid, menuItemId: id1 }), /이미 쿠폰/);
  await assert.rejects(redeemCoupon({ couponId: c.id, by: { adminId: "owner", storeId: "joseon" } }), /전용/);
  const used = await redeemCoupon({ couponId: c.id, by: { memberId: m.id } });
  assert.equal(used.status, "used");
  await assert.rejects(redeemCoupon({ couponId: c.id, by: { memberId: m.id } }), /이미 사용/);
  await assert.rejects(voidCoupon({ couponId: c.id, adminId: "owner", note: "x" }), /사용 가능 상태/);
  // 확인과 갱신 사이에 사용된 쿠폰은 취소되지 않는다 (조건부 update)
  const n = await issueManualCoupons({ adminId: "owner", target: { memberId: m.id }, useStoreId: "wareureu", menuItemId: null, menuName: "사이드 1개", validDays: 7, note: "테스트", kind: "manual" });
  assert.equal(n, 1);
  const manual = (await listCoupons({ status: "active" })).items.find((x) => x.kind === "manual")!;
  await query(`update coupons set status='used', used_at=now() where id=$1`, [manual.id]);
  await assert.rejects(voidCoupon({ couponId: manual.id, adminId: "owner", note: "늦은 취소" }), /사용 가능 상태|그 사이에 사용/);
  const all = await listCoupons({});
  assert.equal(all.total, 2);
  // 만료 필터는 expires_at 기준
  await query(`update coupons set expires_at=now() - interval '1 day' where id=$1`, [manual.id]);
  await query(`update coupons set status='active', used_at=null where id=$1`, [manual.id]);
  assert.equal((await listCoupons({ status: "expired" })).total, 1, "expired filter finds active-but-past coupons");
  assert.equal((await listCoupons({ status: "active" })).total, 0);

  // 사이드 고르기 기한: 승인 후 유효일이 지나면 발급 불가
  const oldRid = await tx((q) =>
    insertReceipt(q, { memberId: m.id, storeId: "joseon", status: "approved", reasons: [], image, imageMime: "image/jpeg", sha256: "f".repeat(64), dhash: "0123456789abcdac", ocr: null, receiptAt: now, amount: 20000, approvalNo: "22222222", cardLast4: null }),
  );
  await query(`update receipts set created_at=now() - interval '40 days' where id=$1`, [oldRid]);
  await assert.rejects(issueSideCoupon({ memberId: m.id, receiptId: oldRid, menuItemId: id1 }), /기간이 지났어요/);

  // 설정
  const rules = await getRules();
  assert.equal(rules.receiptValidHours, 24);
  assert.equal(rules.maxAutoAmount, 1000000);
  assert.equal(rules.dailyOcrLimit, 500);
  const saved = await saveRules({ receiptValidHours: 12 });
  assert.equal(saved.receiptValidHours, 12);
  assert.equal((await getRules()).receiptValidHours, 12);

  // 회원 누적
  const mm = await getMember(m.id);
  assert.equal(mm!.totalSpend, 32000);
  assert.equal(mm!.visitCount, 1);

  // 통계
  const stats = await dashboardStats(now);
  assert.equal(stats.members, 1);
  assert.equal(stats.recentDays.length, 14);
  assert.equal(stats.byStore.length, 3);

  // 속도 제한
  assert.equal(await rateLimit("t", 2, 60), true);
  assert.equal(await rateLimit("t", 2, 60), true);
  assert.equal(await rateLimit("t", 2, 60), false);

  // 영수증 파이프라인 (API 키 없음 → 직원 확인)
  const sharp = (await import("sharp")).default;
  const mk = (bg: string, w = 600) => sharp({ create: { width: w, height: 900, channels: 3, background: bg } }).jpeg().toBuffer();
  const jpeg = await mk("#fdfcf8");
  const { submitReceipt, adminDecideReceipt } = await import("../src/lib/receipt/service");
  const m3 = await findOrCreateMember("01099998888");
  const s1 = await submitReceipt({ memberId: m3.id, file: jpeg, now });
  assert.equal(s1.receipt.status, "review");
  assert.deepEqual(s1.receipt.reasons, ["OCR_UNAVAILABLE"]);
  const s2 = await submitReceipt({ memberId: m3.id, file: jpeg, now });
  assert.equal(s2.receipt.status, "rejected");
  assert.deepEqual(s2.receipt.reasons, ["DUPLICATE_IMAGE"]);
  const s3 = await submitReceipt({ memberId: m3.id, file: await mk("#f0ede4", 640), now });
  assert.equal(s3.receipt.status, "review");

  // 직원은 다른 매장 영수증을 판정할 수 없고 매장도 바꿀 수 없다
  await assert.rejects(adminDecideReceipt({ receiptId: s1.receipt.id, approve: true, adminId: "tokyo1", note: null, storeId: "wareureu", restrictToStore: "tokyo" }), /매장을 바꿀 수 없습니다/);
  await assert.rejects(adminDecideReceipt({ receiptId: "nope", approve: true, adminId: "owner", note: null }), /찾을 수 없습니다/);

  // 동시 승인: 둘 중 하나만 통과하고 누적은 한 번만
  const results = await Promise.allSettled([
    adminDecideReceipt({ receiptId: s1.receipt.id, approve: true, adminId: "owner", note: "확인", storeId: "wareureu", amount: 45000, receiptAt: now }),
    adminDecideReceipt({ receiptId: s1.receipt.id, approve: true, adminId: "owner", note: "확인", storeId: "wareureu", amount: 45000, receiptAt: now }),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1, "exactly one concurrent approval succeeds");
  const rejectedMsg = (results.find((x) => x.status === "rejected") as PromiseRejectedResult).reason as Error;
  assert.match(rejectedMsg.message, /이미 승인된/);
  const approved = (await getReceipt(s1.receipt.id))!;
  assert.equal(approved.status, "approved");
  assert.equal(approved.storeId, "wareureu");
  const m3b = await getMember(m3.id);
  assert.equal(m3b!.totalSpend, 45000, "spend applied exactly once");
  assert.equal(m3b!.visitCount, 1);
  assert.equal((await one<{ n: number }>(`select count(*)::int as n from spend_ledger where receipt_id=$1`, [s1.receipt.id]))?.n, 1);
  await assert.rejects(adminDecideReceipt({ receiptId: s1.receipt.id, approve: false, adminId: "owner", note: "x" }), /이미 승인된/);

  // 반려된 중복 사진(s2)을 승인하려 하면 사람이 읽을 메시지
  await assert.rejects(adminDecideReceipt({ receiptId: s2.receipt.id, approve: true, adminId: "owner", note: null, storeId: "wareureu", amount: 45000 }), /같은 사진의 영수증이 이미 접수/);
  // 같은 매장에 같은 승인번호가 살아 있으면 승인 불가
  await query(`update receipts set approval_no='12345678' where id=$1`, [s3.receipt.id]);
  await assert.rejects(adminDecideReceipt({ receiptId: s3.receipt.id, approve: true, adminId: "owner", note: null, storeId: "joseon", amount: 15000 }), /같은 승인번호/);
  const okOther = await adminDecideReceipt({ receiptId: s3.receipt.id, approve: true, adminId: "owner", note: null, storeId: "wareureu", amount: 15000 });
  assert.equal(okOther.status, "approved", "same approval number at another store is fine");

  const id3 = await upsertMenuItem({ storeId: "wareureu", name: "쫀득감자", price: 8900, description: null, isGift: true, active: true, sort: 1 });
  await assert.rejects(issueSideCoupon({ memberId: m3.id, receiptId: approved.id, menuItemId: id3 }), /다른 두 매장/);
  const c3 = await issueSideCoupon({ memberId: m3.id, receiptId: approved.id, menuItemId: id2 });
  assert.equal(c3.useStoreId, "joseon");
  const img = await getReceiptImage(s1.receipt.id);
  assert.ok(img && img.data.length > 100 && img.mime === "image/jpeg");
  await assert.rejects(submitReceipt({ memberId: m3.id, file: Buffer.from("not an image"), now }), /이미지를 읽을 수 없습니다/);

  // 하루 시도 한도(반려 포함): 3회로 낮추면 4번째는 인식 없이 반려
  await saveRules({ dailyAttemptLimit: 3, dailyLimitPerMember: 3 });
  const m4 = await findOrCreateMember("01077776666");
  const a1 = await submitReceipt({ memberId: m4.id, file: await mk("#eeeeee"), now });
  const a2 = await submitReceipt({ memberId: m4.id, file: await mk("#dddddd"), now });
  const a3 = await submitReceipt({ memberId: m4.id, file: await mk("#cccccc"), now });
  assert.deepEqual([a1, a2, a3].map((x) => x.receipt.status), ["review", "review", "review"]);
  const a4 = await submitReceipt({ memberId: m4.id, file: await mk("#bbbbbb"), now });
  assert.equal(a4.receipt.status, "rejected");
  assert.deepEqual(a4.receipt.reasons, ["DAILY_LIMIT"]);
  await saveRules({ dailyAttemptLimit: 10 });
  // 전체 OCR 상한이 0 이하면 끔, 아주 작으면 직원 확인
  await saveRules({ dailyOcrLimit: 1 });
  const m5 = await findOrCreateMember("01055554444");
  const b1 = await submitReceipt({ memberId: m5.id, file: await mk("#aaaaaa"), now });
  assert.equal(b1.receipt.status, "review");
  await saveRules({ dailyOcrLimit: 500 });

  // 보관 정리: 반려 7일 / 전체 90일 지나면 사진만 지운다
  await query(`update receipts set created_at=now() - interval '8 days' where id=$1`, [s2.receipt.id]);
  await query(`update receipts set created_at=now() - interval '91 days' where id=$1`, [rid]);
  const purged = await purgeOldData(new Date());
  assert.equal(purged.images, 2);
  assert.equal(await getReceiptImage(s2.receipt.id), null);
  assert.equal((await getReceipt(rid))!.hasImage, false);
  assert.equal((await getReceipt(rid))!.status, "approved", "purge keeps the decision");
  assert.ok(await getReceiptImage(s1.receipt.id), "recent image kept");

  console.log("SMOKE OK");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
