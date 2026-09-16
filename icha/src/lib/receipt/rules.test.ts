import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, type RuleContext } from "./rules";
import { DEFAULT_RULES } from "../config";
import type { ReceiptOcr } from "./ocr";
import { sanitize } from "./ocr";
import { hammingDistance } from "./image";
import { matchStore } from "./match";
import { expiresAtKst, isPickExpired, pickDeadlineFor } from "../coupons";

const now = new Date("2026-09-18T14:00:00+09:00");

function ocr(over: Partial<ReceiptOcr> = {}): ReceiptOcr {
  return {
    is_receipt: true,
    document_type: "card_slip",
    is_cancellation: false,
    merchant_name: "조선칼국수와통막걸리 서면밀레오레본점",
    business_number: null,
    merchant_phone: null,
    merchant_address: "부산 부산진구 동천로85번길 14",
    paid_at: "2026-09-18T12:30:00",
    total_amount: 32000,
    approval_number: "12345678",
    card_last4: "1234",
    payment_method: "card",
    items: [{ name: "칼국수", qty: 2, amount: 20000 }],
    matched_store: "joseon",
    is_reprint: false,
    looks_like_screen_photo: false,
    suspicious_text: false,
    quality_notes: [],
    confidence: { merchant: 0.95, paid_at: 0.95, total_amount: 0.95, approval_number: 0.9 },
    raw_text: "조선칼국수와통막걸리 서면밀레오레본점\n합계 32,000",
    ...over,
  };
}

const noDup = { exactImage: false, similarImage: false, sameApproval: false, sameFingerprint: false };

function ctx(over: Partial<RuleContext> = {}): RuleContext {
  return {
    now,
    rules: DEFAULT_RULES,
    ocr: ocr(),
    ocrFailure: null,
    matchedStore: "joseon",
    dedup: { ...noDup },
    todayCount: 0,
    todayAttempts: 0,
    ...over,
  };
}

test("정상 영수증은 승인", () => {
  const d = decide(ctx());
  assert.equal(d.status, "approved");
  assert.deepEqual(d.reasons, []);
  assert.equal(d.storeId, "joseon");
  assert.equal(d.amount, 32000);
  assert.equal(d.receiptAt?.toISOString(), "2026-09-18T03:30:00.000Z");
});

test("같은 사진은 반려", () => {
  const d = decide(ctx({ dedup: { ...noDup, exactImage: true } }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["DUPLICATE_IMAGE"]);
});

test("승인번호 중복은 반려", () => {
  const d = decide(ctx({ dedup: { ...noDup, sameApproval: true } }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["DUPLICATE_RECEIPT"]);
});

test("매장을 못 읽었어도 승인번호가 중복이면 직원 대기 대신 반려", () => {
  const d = decide(ctx({ matchedStore: null, ocr: ocr({ merchant_name: null, matched_store: "none" }), dedup: { ...noDup, sameApproval: true } }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["DUPLICATE_RECEIPT"]);
});

test("인정 시간이 지난 영수증은 반려", () => {
  const d = decide(ctx({ ocr: ocr({ paid_at: "2026-09-16T12:30:00" }) }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["EXPIRED"]);
});

test("23시간 59분 전은 아직 유효", () => {
  const d = decide(ctx({ ocr: ocr({ paid_at: "2026-09-17T14:01:00" }) }));
  assert.equal(d.status, "approved");
});

test("주문서(빌지)는 반려", () => {
  const d = decide(ctx({ ocr: ocr({ document_type: "order_slip", is_receipt: false, approval_number: null }) }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["ORDER_SLIP"]);
});

test("취소 전표(승인취소·매출취소)는 반려", () => {
  const d = decide(ctx({ ocr: ocr({ is_cancellation: true, approval_number: "87654321", raw_text: "*** 승인취소 ***" }) }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["CANCELLED"]);
  const d2 = decide(ctx({ ocr: ocr({ document_type: "cancel_slip", is_receipt: false }) }));
  assert.equal(d2.status, "rejected");
  assert.deepEqual(d2.reasons, ["CANCELLED"]);
});

test("sanitize: 음수 금액은 취소로 본다", () => {
  const o = sanitize(ocr({ total_amount: -32000 }));
  assert.equal(o.is_cancellation, true);
  assert.equal(o.total_amount, null);
});

test("다른 가게 영수증은 반려", () => {
  const d = decide(ctx({ matchedStore: null, ocr: ocr({ merchant_name: "스타벅스 서면점", matched_store: "none" }) }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["STORE_MISMATCH"]);
});

test("상호를 못 읽으면 직원 확인", () => {
  const d = decide(ctx({ matchedStore: null, ocr: ocr({ merchant_name: null, business_number: null, matched_store: "none" }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["STORE_UNKNOWN"]);
});

test("최소 금액 미만은 반려", () => {
  const d = decide(ctx({ ocr: ocr({ total_amount: 5000 }) }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["MIN_AMOUNT"]);
});

test("자동 승인 상한을 넘는 금액은 직원 확인", () => {
  const d = decide(ctx({ ocr: ocr({ total_amount: 3_200_000 }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["AMOUNT_TOO_HIGH"]);
  const d2 = decide(ctx({ rules: { ...DEFAULT_RULES, maxAutoAmount: 0 }, ocr: ocr({ total_amount: 3_200_000 }) }));
  assert.equal(d2.status, "approved");
});

test("승인번호가 없으면(간이영수증·현금) 자동 승인하지 않고 직원 확인", () => {
  const d = decide(ctx({ ocr: ocr({ document_type: "simple_receipt", payment_method: "cash", approval_number: null, confidence: { merchant: 0.9, paid_at: 0.9, total_amount: 0.9, approval_number: 0 } }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["NO_APPROVAL_NO"]);
});

test("승인번호 신뢰도가 0.5 미만이면 직원 확인", () => {
  const d = decide(ctx({ ocr: ocr({ confidence: { merchant: 0.9, paid_at: 0.9, total_amount: 0.9, approval_number: 0.3 } }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["NO_APPROVAL_NO"]);
});

test("승인번호가 숫자 6~12자리가 아니면 직원 확인", () => {
  const d = decide(ctx({ ocr: ocr({ approval_number: "1234" }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["NO_APPROVAL_NO"]);
});

test("사업자번호가 읽혔는데 등록 매장과 다르면 직원 확인 (도쿄스탠드는 사업자번호 등록됨)", () => {
  const d = decide(ctx({ matchedStore: "tokyo", ocr: ocr({ merchant_name: "도쿄스탠드 부산대점", business_number: "9999999999", matched_store: "tokyo" }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["BIZNO_MISMATCH"]);
  const ok = decide(ctx({ matchedStore: "tokyo", ocr: ocr({ merchant_name: "도쿄스탠드 서면점", business_number: "3071815409", matched_store: "tokyo" }) }));
  assert.equal(ok.status, "approved");
});

test("판독기를 겨냥한 문구가 있으면 직원 확인", () => {
  const d = decide(ctx({ ocr: ocr({ suspicious_text: true }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["SUSPICIOUS_TEXT"]);
});

test("화면 재촬영 의심은 직원 확인", () => {
  const d = decide(ctx({ ocr: ocr({ looks_like_screen_photo: true }) }));
  assert.equal(d.status, "review");
  assert.ok(d.reasons.includes("SCREEN_PHOTO"));
});

test("일일 한도 초과는 반려", () => {
  const d = decide(ctx({ todayCount: 3 }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["DAILY_LIMIT"]);
});

test("반려 포함 시도 한도 초과도 반려 (인식 전에 걸린다)", () => {
  const d = decide(ctx({ todayCount: 0, todayAttempts: 10 }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["DAILY_LIMIT"]);
  const off = decide(ctx({ rules: { ...DEFAULT_RULES, dailyAttemptLimit: 0 }, todayCount: 0, todayAttempts: 50 }));
  assert.equal(off.status, "approved");
});

test("OCR 불가 시 직원 확인으로", () => {
  const d = decide(ctx({ ocr: null, ocrFailure: "unavailable" }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["OCR_UNAVAILABLE"]);
});

test("신뢰도 낮으면 직원 확인", () => {
  const d = decide(ctx({ ocr: ocr({ confidence: { merchant: 0.9, paid_at: 0.3, total_amount: 0.9, approval_number: 0.9 } }) }));
  assert.equal(d.status, "review");
  assert.deepEqual(d.reasons, ["LOW_CONFIDENCE"]);
});

test("이벤트 중단 시 반려", () => {
  const d = decide(ctx({ rules: { ...DEFAULT_RULES, eventActive: false } }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["EVENT_INACTIVE"]);
});

test("해밍 거리", () => {
  assert.equal(hammingDistance("0000000000000000", "0000000000000000"), 0);
  assert.equal(hammingDistance("0000000000000000", "000000000000000f"), 4);
  assert.equal(hammingDistance("ffffffffffffffff", "0000000000000000"), 64);
});

test("매장 매칭: 상호+주소", () => {
  const m = matchStore(ocr());
  assert.equal(m.storeId, "joseon");
});

test("매장 매칭: 다른 가게", () => {
  const m = matchStore(ocr({ merchant_name: "스타벅스 서면점", merchant_address: "부산 부산진구 중앙대로", matched_store: "none", raw_text: "스타벅스" }));
  assert.equal(m.storeId, null);
});

test("매장 매칭: 같은 상호라도 사업자번호가 다르면 매칭하지 않는다 (다른 지점)", () => {
  const m = matchStore(ocr({ merchant_name: "도쿄스탠드 부산대점", merchant_address: "부산 금정구 장전동", business_number: "9999999999", matched_store: "tokyo", raw_text: "도쿄스탠드 부산대점" }));
  assert.equal(m.storeId, null);
  assert.ok(m.evidence.some((e) => e.includes("사업자번호 불일치")));
});

test("매장 매칭: 본문의 짧은 별칭(4자 미만)만으로는 매칭하지 않는다", () => {
  const m = matchStore(ocr({ merchant_name: "카페 어딘가", merchant_address: null, matched_store: "none", raw_text: "조칼 옆 카페" }));
  assert.equal(m.storeId, null);
});

test("쿠폰 만료는 발급일 기준 N일 뒤 23:59:59(KST)", () => {
  const issued = new Date("2026-09-01T21:00:00+09:00");
  const e = expiresAtKst(issued, 30);
  assert.equal(e.toISOString(), new Date("2026-10-01T23:59:59+09:00").toISOString());
  // 자정 직전 발급도 같은 날 기준
  assert.equal(expiresAtKst(new Date("2026-09-01T23:59:00+09:00"), 1).toISOString(), new Date("2026-09-02T23:59:59+09:00").toISOString());
});

test("사이드 고르기 기한 = 승인 시각 + 쿠폰 유효일", () => {
  const r = { reviewedAt: null, createdAt: new Date("2026-09-01T21:00:00+09:00") };
  assert.equal(pickDeadlineFor(r, DEFAULT_RULES).toISOString(), new Date("2026-10-01T23:59:59+09:00").toISOString());
  assert.equal(isPickExpired(r, DEFAULT_RULES, new Date("2026-10-01T23:00:00+09:00")), false);
  assert.equal(isPickExpired(r, DEFAULT_RULES, new Date("2026-10-02T00:00:01+09:00")), true);
  // 관리자 승인 건은 승인 시각 기준
  const r2 = { reviewedAt: new Date("2026-09-10T10:00:00+09:00"), createdAt: new Date("2026-09-01T21:00:00+09:00") };
  assert.equal(isPickExpired(r2, DEFAULT_RULES, new Date("2026-10-05T00:00:00+09:00")), false);
});
