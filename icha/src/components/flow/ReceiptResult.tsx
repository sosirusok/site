"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatWon } from "@/lib/config";
import { Stamp } from "@/components/ui/Stamp";
import { fmtDateTime, fmtOcrPaidAt, maskApproval } from "./format";
import type { ReceiptApiOk, StoreLite, UploadRules } from "./types";
import styles from "./ReceiptUploader.module.css";

type StepState = { label: string; state: string; tone: "ok" | "hold" | "bad" };

/** 사유 코드로 세 단계(읽기·대조·중복)의 결과 문구를 정한다 — 실제 판정 근거만 보여 준다 */
function stepStates(reasons: { code: string }[], status: ReceiptApiOk["receipt"]["status"]): StepState[] {
  const codes = new Set(reasons.map((r) => r.code));
  const has = (...cs: string[]) => cs.some((c) => codes.has(c));
  const ocrDown = has("OCR_UNAVAILABLE", "OCR_ERROR");
  const read: StepState = ocrDown
    ? { label: "영수증 읽기", state: "보류", tone: "hold" }
    : has("NOT_RECEIPT", "ORDER_SLIP", "SCREEN_PHOTO", "REPRINT")
      ? { label: "영수증 읽기", state: "아님", tone: "bad" }
      : has("DATE_UNREADABLE", "LOW_CONFIDENCE")
        ? { label: "영수증 읽기", state: "일부 흐림", tone: "hold" }
        : { label: "영수증 읽기", state: "완료", tone: "ok" };
  const store: StepState = ocrDown
    ? { label: "매장 대조", state: "직원 확인", tone: "hold" }
    : has("STORE_MISMATCH")
      ? { label: "매장 대조", state: "다른 매장", tone: "bad" }
      : has("STORE_UNKNOWN")
        ? { label: "매장 대조", state: "미확인", tone: "hold" }
        : read.tone === "bad"
          ? { label: "매장 대조", state: "생략", tone: "hold" }
          : { label: "매장 대조", state: "일치", tone: "ok" };
  const dup: StepState = has("DUPLICATE_IMAGE", "DUPLICATE_RECEIPT", "DUPLICATE_FINGERPRINT")
    ? { label: "중복 확인", state: "이미 등록", tone: "bad" }
    : has("SIMILAR_IMAGE")
      ? { label: "중복 확인", state: "비슷한 사진", tone: "hold" }
      : status === "rejected" && has("DAILY_LIMIT", "EVENT_INACTIVE")
        ? { label: "중복 확인", state: "생략", tone: "hold" }
        : { label: "중복 확인", state: "없음", tone: "ok" };
  return [read, store, dup];
}

export function ReceiptResult({
  result,
  stores,
  rules,
  onRetry,
}: {
  result: ReceiptApiOk;
  stores: StoreLite[];
  rules: UploadRules;
  onRetry: () => void;
}) {
  const { receipt, read, giftStoreIds } = result;
  const [stampOn, setStampOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStampOn(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const storeOf = (id: string | null) => stores.find((s) => s.id === id) ?? null;
  const store = storeOf(receipt.storeId);
  const giftNames = giftStoreIds.map((id) => storeOf(id)?.shortName ?? id);
  const steps = stepStates(receipt.reasons, receipt.status);
  const items = read?.items.slice(0, 4) ?? [];
  const paidAt = receipt.receiptAt ? fmtDateTime(receipt.receiptAt) : read?.paidAt ? fmtOcrPaidAt(read.paidAt) : "읽지 못함";
  const amount = receipt.amount ?? read?.amount ?? null;
  const shownReasons = receipt.reasons.filter((r) => !["MANUAL_APPROVED", "MANUAL_REJECTED"].includes(r.code));

  const verdict =
    receipt.status === "approved"
      ? { stamp: "승인", color: undefined as string | undefined, title: "승인됐어요.", text: `${giftNames.join(" · ")}에서 사이드 한 접시를 고를 수 있어요. 쿠폰은 발급일부터 ${rules.couponValidDays}일 동안 써요.` }
      : receipt.status === "review"
        ? { stamp: "대기", color: "#6b665e", title: "직원이 직접 확인해요.", text: "자동으로 읽지 못한 부분을 직원이 사진으로 확인해요. 영업 중에는 보통 몇 분이면 끝나고, 승인되면 쿠폰함에서 사이드를 고를 수 있어요." }
        : { stamp: "반려", color: undefined, title: "이번 영수증은 받을 수 없어요.", text: "아래 사유를 확인해 주세요. 사진 문제라면 다시 찍어 올릴 수 있어요." };

  return (
    <div className={styles.result}>
      <p className="sr-only" aria-live="polite">영수증 판정: {verdict.title}</p>

      <ul className={styles.steps}>
        {steps.map((s, i) => (
          <li key={s.label} className={styles.line} style={{ "--i": i } as React.CSSProperties}>
            <span>{s.label}</span>
            <span className={styles.leader} aria-hidden="true" />
            <span className={`${styles.state} ${styles[`tone_${s.tone}`] ?? ""}`}>{s.state}</span>
          </li>
        ))}
      </ul>

      <hr className={styles.sep} style={{ "--i": 3 } as React.CSSProperties} />

      <dl className={styles.rows} style={{ "--i": 3.4 } as React.CSSProperties}>
        <div className={styles.row}><dt>매장</dt><dd>{store ? store.shortName : read?.merchant ? `${read.merchant} (미확인)` : "직원 확인"}</dd></div>
        <div className={styles.row}><dt>결제 일시</dt><dd>{paidAt}</dd></div>
        <div className={styles.row}><dt>결제 금액</dt><dd>{amount == null ? "읽지 못함" : formatWon(amount)}</dd></div>
        <div className={styles.row}><dt>승인번호</dt><dd>{maskApproval(read?.approvalNo)}</dd></div>
        {items.length > 0 && (
          <div className={`${styles.row} ${styles.rowItems}`}>
            <dt>품목</dt>
            <dd>{items.map((it) => `${it.name}${it.qty && it.qty > 1 ? ` ×${it.qty}` : ""}`).join(" · ")}{(read?.items.length ?? 0) > 4 ? " 외" : ""}</dd>
          </div>
        )}
        <div className={styles.row}><dt>접수</dt><dd>{fmtDateTime(receipt.createdAt)}</dd></div>
      </dl>

      <hr className={styles.sep} style={{ "--i": 4.6 } as React.CSSProperties} />

      <div className={styles.verdict} data-status={receipt.status}>
        <div className={styles.stampSlot} aria-hidden={!stampOn}>
          {stampOn && <Stamp text={verdict.stamp} slam color={verdict.color} size={104} />}
        </div>
        <div className={`${styles.verdictText} ${stampOn ? styles.shown : ""}`}>
          <p className={styles.verdictTitle}>{verdict.title}</p>
          <p className={styles.verdictBody}>{verdict.text}</p>
        </div>
      </div>

      {stampOn && shownReasons.length > 0 && receipt.status !== "approved" && (
        <ul className={styles.reasons} aria-label="사유">
          {shownReasons.map((r) => (
            <li key={r.code}>{r.text}</li>
          ))}
        </ul>
      )}

      {stampOn && receipt.status === "rejected" && (
        <div className={styles.tips}>
          <p className={styles.tipsTitle}>다시 찍을 때는</p>
          <ul>
            <li>영수증을 평평하게 펴고, 네 귀퉁이가 다 나오게 찍어요.</li>
            <li>상호·결제 일시·금액·승인번호 줄이 흐리지 않게 가까이서 찍어요.</li>
            <li>화면 캡처, 재출력본, 주문서(빌지)는 받지 않아요. 종이 원본만요.</li>
          </ul>
        </div>
      )}

      {stampOn && (
        <div className={styles.actions}>
          {receipt.status === "approved" && (
            <Link href={`/pick/${receipt.id}`} className="btn btn-lg btn-block">무료 사이드 고르러 가기</Link>
          )}
          {receipt.status === "review" && (
            <>
              <Link href="/wallet" className="btn btn-lg btn-block">쿠폰함에서 확인하기</Link>
              <button type="button" className={`btn btn-block ${styles.inkOutline}`} onClick={onRetry}>다른 영수증 올리기</button>
            </>
          )}
          {receipt.status === "rejected" && (
            <>
              <button type="button" className="btn btn-lg btn-block" onClick={onRetry}>다시 찍기</button>
              <Link href="/guide" className={`btn btn-block ${styles.inkOutline}`}>인정되지 않는 경우 보기</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
