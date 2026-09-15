import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, type RuleContext } from "./rules";
import { DEFAULT_RULES } from "../config";
import type { ReceiptOcr } from "./ocr";
import { hammingDistance } from "./image";
import { matchStore } from "./match";

const now = new Date("2026-09-18T14:00:00+09:00");

function ocr(over: Partial<ReceiptOcr> = {}): ReceiptOcr {
  return {
    is_receipt: true,
    document_type: "card_slip",
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
    quality_notes: [],
    confidence: { merchant: 0.95, paid_at: 0.95, total_amount: 0.95, approval_number: 0.9 },
    raw_text: "조선칼국수와통막걸리 서면밀레오레본점\n합계 32,000",
    ...over,
  };
}

function ctx(over: Partial<RuleContext> = {}): RuleContext {
  return {
    now,
    rules: DEFAULT_RULES,
    ocr: ocr(),
    ocrFailure: null,
    matchedStore: "joseon",
    dedup: { exactImage: false, similarImage: false, sameApproval: false, sameFingerprint: false },
    todayCount: 0,
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
  const d = decide(ctx({ dedup: { exactImage: true, similarImage: false, sameApproval: false, sameFingerprint: false } }));
  assert.equal(d.status, "rejected");
  assert.deepEqual(d.reasons, ["DUPLICATE_IMAGE"]);
});

test("승인번호 중복은 반려", () => {
  const d = decide(ctx({ dedup: { exactImage: false, similarImage: false, sameApproval: true, sameFingerprint: false } }));
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
