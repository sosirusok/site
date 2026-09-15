/**
 * 영수증 판정 규칙 — 순수 함수. DB 접근 없음(테스트 가능).
 */
import type { ReasonCode, Rules, StoreId } from "../config";
import type { ReceiptOcr } from "./ocr";
import { parsePaidAt } from "./ocr";

export type DedupFlags = {
  /** 같은 사진(sha256)이 이미 approved/review 로 존재 */
  exactImage: boolean;
  /** 비슷한 사진(dHash)이 최근에 존재 */
  similarImage: boolean;
  /** 같은 승인번호가 이미 존재 */
  sameApproval: boolean;
  /** 같은 매장·결제시각·금액이 이미 존재 */
  sameFingerprint: boolean;
};

export type RuleContext = {
  now: Date;
  rules: Rules;
  ocr: ReceiptOcr | null;
  ocrFailure: "unavailable" | "error" | null;
  matchedStore: StoreId | null;
  dedup: DedupFlags;
  /** 오늘(KST) 이 회원이 이미 접수한 건수(approved+review) */
  todayCount: number;
};

export type Decision = {
  status: "approved" | "review" | "rejected";
  reasons: ReasonCode[];
  storeId: StoreId | null;
  amount: number | null;
  receiptAt: Date | null;
  approvalNo: string | null;
  cardLast4: string | null;
};

export function decide(ctx: RuleContext): Decision {
  const { rules, ocr, now } = ctx;
  const reasons: ReasonCode[] = [];
  const base = (status: Decision["status"]): Decision => ({
    status,
    reasons,
    storeId: ctx.matchedStore,
    amount: ocr?.total_amount ?? null,
    receiptAt: parsePaidAt(ocr?.paid_at),
    approvalNo: ocr?.approval_number?.replace(/\s/g, "") || null,
    cardLast4: ocr?.card_last4?.replace(/\D/g, "").slice(-4) || null,
  });
  const reject = (c: ReasonCode) => {
    reasons.push(c);
    return base("rejected");
  };

  if (!rules.eventActive) return reject("EVENT_INACTIVE");
  if (ctx.dedup.exactImage) return reject("DUPLICATE_IMAGE");
  if (ctx.todayCount >= rules.dailyLimitPerMember) return reject("DAILY_LIMIT");

  if (ctx.ocrFailure || !ocr) {
    reasons.push(ctx.ocrFailure === "unavailable" ? "OCR_UNAVAILABLE" : "OCR_ERROR");
    if (ctx.dedup.similarImage) reasons.push("SIMILAR_IMAGE");
    return base("review");
  }

  if (ocr.document_type === "screen_capture") return reject("SCREEN_PHOTO");
  if (ocr.document_type === "order_slip") return reject("ORDER_SLIP");
  if (!ocr.is_receipt) return reject("NOT_RECEIPT");

  if (!ctx.matchedStore) {
    // 상호를 읽었는데 우리 매장이 아니면 반려, 상호 자체를 못 읽었으면 직원 확인
    if (ocr.merchant_name || ocr.business_number) return reject("STORE_MISMATCH");
    reasons.push("STORE_UNKNOWN");
    return base("review");
  }

  if (ctx.dedup.sameApproval) return reject("DUPLICATE_RECEIPT");
  if (ctx.dedup.sameFingerprint) return reject("DUPLICATE_FINGERPRINT");

  const receiptAt = parsePaidAt(ocr.paid_at);
  if (!receiptAt) {
    reasons.push("DATE_UNREADABLE");
  } else {
    const ageMs = now.getTime() - receiptAt.getTime();
    if (ageMs < -30 * 60 * 1000) reasons.push("FUTURE_DATE");
    else if (ageMs > rules.receiptValidHours * 3600 * 1000) return reject("EXPIRED");
  }

  if (ocr.total_amount == null) {
    reasons.push("LOW_CONFIDENCE");
  } else if (rules.minAmount > 0 && ocr.total_amount < rules.minAmount) {
    return reject("MIN_AMOUNT");
  }

  if (ctx.dedup.similarImage) reasons.push("SIMILAR_IMAGE");
  if (ocr.looks_like_screen_photo) reasons.push("SCREEN_PHOTO");
  if (ocr.is_reprint) reasons.push("REPRINT");

  const c = ocr.confidence;
  if (
    c.merchant < rules.minConfidence ||
    c.paid_at < rules.minConfidence ||
    c.total_amount < rules.minConfidence
  ) {
    if (!reasons.includes("LOW_CONFIDENCE")) reasons.push("LOW_CONFIDENCE");
  }

  return base(reasons.length ? "review" : "approved");
}
