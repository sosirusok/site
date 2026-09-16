"use client";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { joinOr } from "@/components/site/StoreHelpers";
import { formatWon } from "@/lib/config";
import { fmtDateTime, fmtOcrPaidAt } from "./format";
import type { RetryMode } from "./ReceiptUploader";
import type { ReceiptApiOk, StoreLite, UploadRules } from "./types";
import styles from "./ReceiptResult.module.css";

/** 반려 사유 코드 → 상태 그림 */
const PHOTO_CODES = ["NOT_RECEIPT", "SCREEN_PHOTO", "REPRINT", "ORDER_SLIP", "LOW_CONFIDENCE", "DATE_UNREADABLE", "NO_APPROVAL_NO", "SUSPICIOUS_TEXT", "OCR_ERROR", "OCR_UNAVAILABLE"];
const STORE_CODES = ["STORE_MISMATCH", "STORE_UNKNOWN", "BIZNO_MISMATCH"];
const USED_CODES = ["DUPLICATE_IMAGE", "SIMILAR_IMAGE", "DUPLICATE_RECEIPT", "DUPLICATE_FINGERPRINT"];

function rejectArt(codes: string[]): { name: string; title: string } {
  if (codes.some((c) => USED_CODES.includes(c))) return { name: "status-used", title: "이미 쓴 영수증이에요" };
  if (codes.some((c) => STORE_CODES.includes(c))) return { name: "status-wrong-store", title: "참여 매장 영수증이 아니에요" };
  if (codes.some((c) => PHOTO_CODES.includes(c))) return { name: "status-photo-fail", title: "사진을 읽지 못했어요" };
  return { name: "status-photo-fail", title: "이 영수증은 못 받았어요" };
}

export function ReceiptResult({
  result,
  stores,
  rules,
  totalSpend,
  onRetry,
}: {
  result: ReceiptApiOk;
  stores: StoreLite[];
  rules: UploadRules;
  /** 이번 건까지 더한 누적 금액 */
  totalSpend: number;
  onRetry: (mode: RetryMode) => void;
}) {
  const { receipt, read, giftStoreIds } = result;
  const storeOf = (id: string | null) => stores.find((s) => s.id === id) ?? null;
  const store = storeOf(receipt.storeId);
  const giftNames = giftStoreIds.map((id) => storeOf(id)?.shortName ?? id);
  const paidAt = receipt.receiptAt ? fmtDateTime(receipt.receiptAt) : read?.paidAt ? fmtOcrPaidAt(read.paidAt) : "-";
  const amount = receipt.amount ?? read?.amount ?? null;
  const reasons = receipt.reasons.filter((r) => !["MANUAL_APPROVED", "MANUAL_REJECTED"].includes(r.code));
  const status = receipt.status;

  if (status === "approved") {
    return (
      <div className={styles.result} data-status="approved">
        <p className="sr-only" aria-live="polite">영수증이 확인됐어요.</p>
        <div className={styles.head}>
          <Art name="status-ok" width={96} />
          <p className="h2">영수증이 확인됐어요</p>
          <p className="cap">{joinOr(giftNames)}에서 한 잔 골라요. 쿠폰은 {rules.couponValidDays}일 동안 써요.</p>
        </div>
        <div className="paper">
          <div className="row"><b>매장</b><span className="val">{store ? store.shortName : read?.merchant ?? "-"}</span></div>
          <div className="row"><b>결제 일시</b><span className="val">{paidAt}</span></div>
          <div className="row"><b>결제 금액</b><span className="val">{amount == null ? "-" : formatWon(amount)}</span></div>
          <div className="dots" />
          <div className="row"><b>누적 금액</b><span className="val">{formatWon(totalSpend)}</span></div>
        </div>
        <div className={styles.actions}>
          <Link href={`/pick/${receipt.id}`} className="btn btn-block">옆집 한 잔 고르기</Link>
          <Link href="/wallet" className={`btn-text ${styles.later}`}>나중에 쿠폰함에서 고를게요</Link>
        </div>
      </div>
    );
  }

  if (status === "review") {
    return (
      <div className={styles.result} data-status="review">
        <p className="sr-only" aria-live="polite">직원이 확인할게요.</p>
        <div className={styles.head}>
          <Art name="status-checking" width={96} />
          <p className="h2">직원이 확인할게요</p>
          <p className="cap">읽지 못한 부분이 있어요. 확인이 끝나면 쿠폰함에서 고를 수 있어요.</p>
        </div>
        {reasons.length > 0 && (
          <ul className={styles.reasons} aria-label="확인이 필요한 이유">
            {reasons.map((r) => <li key={r.code}>{r.text}</li>)}
          </ul>
        )}
        <div className={styles.actions}>
          <Link href="/wallet" className="btn btn-block">쿠폰함 보기</Link>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => onRetry(null)}>다른 영수증 올리기</button>
        </div>
      </div>
    );
  }

  const art = rejectArt(reasons.map((r) => r.code));
  // 제목과 같은 말로 시작하는 사유는 한 번만 보여 준다
  const why = reasons.filter((r) => !r.text.startsWith(art.title.replace(/이에요$/, "")));
  return (
    <div className={styles.result} data-status="rejected">
      <p className="sr-only" aria-live="polite">영수증을 받지 못했어요.</p>
      <div className={styles.head}>
        <Art name={art.name} width={96} />
        <p className="h2">{art.title}</p>
        {why.length > 0 && <p className="cap">{why.map((r) => r.text).join(" ")}</p>}
      </div>
      <p className="cap">평평하게 펴서 네 귀퉁이가 다 나오게, 글자가 또렷하게 찍어 주세요.</p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-block" onClick={() => onRetry("camera")}>다시 올리기</button>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => onRetry("album")}>앨범에서 고르기</button>
      </div>
    </div>
  );
}
