/**
 * 영수증 판정 규칙 — 순수 함수. DB 접근 없음(테스트 가능).
 *
 * 판정 순서(앞에서 걸리면 뒤는 보지 않는다):
 *  1. 이벤트 중단 / 같은 사진 / 하루 한도 → 반려
 *  2. 자동 인식 실패 → 직원 확인
 *  3. 화면 캡처·주문서·영수증 아님·취소 전표 → 반려
 *  4. 승인번호·지문 중복 → 반려 (매장을 못 읽었어도 중복이면 먼저 걸러 직원 대기열을 줄인다)
 *  5. 매장 매칭 실패 → 반려(상호를 읽었을 때) 또는 직원 확인(못 읽었을 때)
 *  6. 결제 일시·금액 검사 → 반려 또는 직원 확인 사유 누적
 *  7. 승인번호 없음/흐림, 사업자번호 불일치, 유사 사진, 화면 촬영 의심, 재출력, 의심 문구, 낮은 신뢰도 → 직원 확인 사유 누적
 *  8. 사유가 하나도 없으면 자동 승인
 */
import type { ReasonCode, Rules, StoreId } from "../config";
import { STORE_BY_ID } from "../stores";
import type { ReceiptOcr } from "./ocr";
import { parsePaidAt } from "./ocr";

export type DedupFlags = {
  /** 같은 사진(sha256)이 이미 approved/review 로 존재 */
  exactImage: boolean;
  /** 비슷한 사진(dHash)이 최근에 존재 */
  similarImage: boolean;
  /** 같은 매장(또는 매장 미확정)의 같은 승인번호가 이미 존재 */
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
  /** 오늘(KST) 이 회원의 업로드 시도 건수(반려 포함). 생략하면 todayCount 와 같게 본다 */
  todayAttempts?: number;
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

/** 승인번호로 인정하는 형태: 숫자 6~12자리 */
export const APPROVAL_NO_RE = /^\d{6,12}$/;
/** 승인번호 신뢰도가 이 값 미만이면 자동 승인하지 않는다 (설정값과 별개의 하한) */
export const MIN_APPROVAL_CONFIDENCE = 0.5;

const digits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

/** 한국 시간 기준 달력 날짜(YYYY-MM-DD) */
function kstDate(d: Date): string {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

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
  const flag = (c: ReasonCode) => {
    if (!reasons.includes(c)) reasons.push(c);
  };

  if (!rules.eventActive) return reject("EVENT_INACTIVE");
  if (ctx.dedup.exactImage) return reject("DUPLICATE_IMAGE");
  if (ctx.todayCount >= rules.dailyLimitPerMember) return reject("DAILY_LIMIT");
  if (rules.dailyAttemptLimit > 0 && (ctx.todayAttempts ?? ctx.todayCount) >= rules.dailyAttemptLimit) return reject("DAILY_LIMIT");

  if (ctx.ocrFailure || !ocr) {
    reasons.push(ctx.ocrFailure === "unavailable" ? "OCR_UNAVAILABLE" : "OCR_ERROR");
    if (ctx.dedup.similarImage) reasons.push("SIMILAR_IMAGE");
    return base("review");
  }

  if (ocr.document_type === "screen_capture") return reject("SCREEN_PHOTO");
  if (ocr.document_type === "order_slip") return reject("ORDER_SLIP");
  if (ocr.is_cancellation || ocr.document_type === "cancel_slip") return reject("CANCELLED");
  if (!ocr.is_receipt) return reject("NOT_RECEIPT");

  // 중복은 매장 매칭보다 먼저: 매장을 못 읽은 재업로드가 직원 대기열로 올라가지 않게
  if (ctx.dedup.sameApproval) return reject("DUPLICATE_RECEIPT");
  if (ctx.dedup.sameFingerprint) return reject("DUPLICATE_FINGERPRINT");

  if (!ctx.matchedStore) {
    // 상호를 읽었는데 우리 매장이 아니면 반려, 상호 자체를 못 읽었으면 직원 확인
    if (ocr.merchant_name || ocr.business_number) return reject("STORE_MISMATCH");
    reasons.push("STORE_UNKNOWN");
    return base("review");
  }

  const receiptAt = parsePaidAt(ocr.paid_at);
  if (!receiptAt) {
    flag("DATE_UNREADABLE");
  } else {
    const ageMs = now.getTime() - receiptAt.getTime();
    if (ageMs < -30 * 60 * 1000) flag("FUTURE_DATE");
    else if (ageMs > rules.receiptValidHours * 3600 * 1000) return reject("EXPIRED");
    else if (rules.sameDayOnly && kstDate(receiptAt) !== kstDate(now)) return reject("EXPIRED");
  }

  if (ocr.total_amount == null) {
    flag("LOW_CONFIDENCE");
  } else if (rules.minAmount > 0 && ocr.total_amount < rules.minAmount) {
    return reject("MIN_AMOUNT");
  } else if (rules.maxAutoAmount > 0 && ocr.total_amount > rules.maxAutoAmount) {
    flag("AMOUNT_TOO_HIGH");
  }

  // 승인번호가 없거나(간이영수증·손글씨) 읽힌 값이 흐리면 자동 승인하지 않는다. 승인번호는 재촬영 중복 탐지의 핵심 열쇠다.
  const approvalNo = ocr.approval_number?.replace(/\s/g, "") ?? "";
  if (!APPROVAL_NO_RE.test(approvalNo) || ocr.confidence.approval_number < MIN_APPROVAL_CONFIDENCE) flag("NO_APPROVAL_NO");

  // 사업자번호가 읽혔는데 등록된 매장 번호와 다르면 같은 상호의 다른 지점일 수 있다
  const storeBiz = digits(STORE_BY_ID[ctx.matchedStore]?.bizNo);
  const readBiz = digits(ocr.business_number);
  if (storeBiz && readBiz && storeBiz !== readBiz) flag("BIZNO_MISMATCH");

  if (ctx.dedup.similarImage) flag("SIMILAR_IMAGE");
  if (ocr.looks_like_screen_photo) flag("SCREEN_PHOTO");
  if (ocr.is_reprint) flag("REPRINT");
  if (ocr.suspicious_text) flag("SUSPICIOUS_TEXT");

  const c = ocr.confidence;
  if (c.merchant < rules.minConfidence || c.paid_at < rules.minConfidence || c.total_amount < rules.minConfidence) flag("LOW_CONFIDENCE");

  return base(reasons.length ? "review" : "approved");
}
