"use client";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { Fx } from "@/components/art/Fx";
import { formatWon } from "@/lib/config";
import { fmtDateTime, fmtOcrPaidAt, joinNames } from "./format";
import type { RetryMode } from "./ReceiptUploader";
import type { ReceiptApiOk, StoreLite, UploadRules } from "./types";
import styles from "./ReceiptResult.module.css";

/** 반려 사유 코드 → 사장님 상태 그림 */
const PHOTO_CODES = ["NOT_RECEIPT", "SCREEN_PHOTO", "REPRINT", "ORDER_SLIP", "LOW_CONFIDENCE", "DATE_UNREADABLE", "NO_APPROVAL_NO", "SUSPICIOUS_TEXT", "OCR_ERROR", "OCR_UNAVAILABLE"];
const STORE_CODES = ["STORE_MISMATCH", "STORE_UNKNOWN", "BIZNO_MISMATCH"];
const USED_CODES = ["DUPLICATE_IMAGE", "SIMILAR_IMAGE", "DUPLICATE_RECEIPT", "DUPLICATE_FINGERPRINT"];

function rejectArt(codes: string[]): { name: string; title: string } {
  if (codes.some((c) => USED_CODES.includes(c))) return { name: "status-used", title: "이미 쓴 영수증이에요" };
  if (codes.some((c) => STORE_CODES.includes(c))) return { name: "status-wrong-store", title: "참여 매장 영수증이 아니에요" };
  if (codes.some((c) => PHOTO_CODES.includes(c))) return { name: "status-photo-fail", title: "사진을 읽지 못했어요" };
  return { name: "retry", title: "이 영수증은 못 받았어요" };
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
  /** 이번 건까지 더한 누적 인정 금액 */
  totalSpend: number;
  onRetry: (mode: RetryMode) => void;
}) {
  const { receipt, read, giftStoreIds } = result;
  const storeOf = (id: string | null) => stores.find((s) => s.id === id) ?? null;
  const store = storeOf(receipt.storeId);
  const giftNames = giftStoreIds.map((id) => storeOf(id)?.shortName ?? id);
  const paidAt = receipt.receiptAt ? fmtDateTime(receipt.receiptAt) : read?.paidAt ? fmtOcrPaidAt(read.paidAt) : "읽지 못했어요";
  const amount = receipt.amount ?? read?.amount ?? null;
  const reasons = receipt.reasons.filter((r) => !["MANUAL_APPROVED", "MANUAL_REJECTED"].includes(r.code));
  const status = receipt.status;

  if (status === "approved") {
    return (
      <div className={styles.result} data-status="approved">
        <p className="sr-only" aria-live="polite">영수증이 승인됐어요.</p>
        <div className={styles.scene}>
          <div className={styles.okArt} aria-hidden="true">
            <Art name="status-ok" sizes="(min-width: 760px) 180px, 38vw" />
          </div>
          <div className={styles.okText}>
            <Fx seq="check" width={72} />
            <p className="h2">영수증이 확인됐어요</p>
          </div>
        </div>
        <p className={styles.lead}>
          {joinNames(giftNames)} 중 한 곳에서 한 잔을 고를 수 있어요. 쿠폰은 받은 날부터 {rules.couponValidDays}일 동안 쓸 수 있어요.
        </p>
        <div className={`paper ${styles.paper}`}>
          <div className="row"><b>매장</b><span className="val">{store ? store.shortName : read?.merchant ?? "-"}</span></div>
          <hr className="dots" />
          <div className="row"><b>결제 일시</b><span className="val">{paidAt}</span></div>
          <div className="row"><b>결제 금액</b><span className="val">{amount == null ? "-" : formatWon(amount)}</span></div>
          <hr className="dots" />
          <div className="row"><b>누적 인정 금액</b><span className="val">{formatWon(totalSpend)}</span></div>
        </div>
        <div className={styles.actions}>
          <ArtButton kind="choose" href={`/pick/${receipt.id}`} width={380} />
          <Link href="/wallet" className={styles.textLink}>나중에 쿠폰함에서 고를게요</Link>
        </div>
      </div>
    );
  }

  if (status === "review") {
    return (
      <div className={styles.result} data-status="review">
        <p className="sr-only" aria-live="polite">직원 확인 대기예요.</p>
        <div className={styles.scene}>
          <div className={styles.waitArt} aria-hidden="true">
            <Art name="status-checking" sizes="(min-width: 760px) 140px, 30vw" />
          </div>
          <div className={styles.okText}>
            <p className="h2">직원이 한 번 볼게요</p>
          </div>
        </div>
        <p className={styles.lead}>
          읽지 못한 부분이 있어서 직원이 사진을 직접 확인해요. 보통 영업 중에 몇 분 안에 끝나고, 직원이 확인한 뒤 쿠폰함에서 고를 수 있어요.
        </p>
        {reasons.length > 0 && (
          <ul className={styles.reasons} aria-label="확인이 필요한 이유">
            {reasons.map((r) => <li key={r.code}>{r.text}</li>)}
          </ul>
        )}
        <div className={styles.actions}>
          <Link href="/wallet" className="btn btn-lg btn-block">쿠폰함 보기</Link>
          <button type="button" className="btn btn-outline btn-block" onClick={() => onRetry(null)}>다른 영수증 올리기</button>
        </div>
      </div>
    );
  }

  const art = rejectArt(reasons.map((r) => r.code));
  return (
    <div className={styles.result} data-status="rejected">
      <p className="sr-only" aria-live="polite">영수증이 반려됐어요.</p>
      <div className={styles.scene}>
        <div className={styles.noArt} aria-hidden="true">
          <Art name={art.name} sizes="(min-width: 760px) 160px, 36vw" />
        </div>
        <div className={styles.okText}>
          <p className="h2">{art.title}</p>
        </div>
      </div>
      {reasons.length > 0 && (
        <ul className={styles.reasons} aria-label="사유">
          {reasons.map((r) => <li key={r.code}>{r.text}</li>)}
        </ul>
      )}
      <div className={styles.tips}>
        <p className={styles.tipsTitle}>다시 찍을 때는</p>
        <ul>
          <li>영수증을 평평하게 펴고 네 귀퉁이가 다 나오게 찍어 주세요.</li>
          <li>상호, 결제 시각, 금액, 승인번호 줄이 또렷하면 바로 확인돼요.</li>
          <li>화면을 찍은 사진, 재출력본, 주문서는 받지 않아요.</li>
        </ul>
      </div>
      <div className={styles.actions}>
        <ArtButton kind="shoot" width={380} onClick={() => onRetry("camera")} />
        <button type="button" className="btn btn-outline btn-block" onClick={() => onRetry("album")}>앨범에서 다시 고르기</button>
      </div>
    </div>
  );
}
