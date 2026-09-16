"use client";
import Link from "next/link";
import { formatWon } from "@/lib/config";
import { fmtDateTime, fmtOcrPaidAt, joinNames, maskApproval } from "./format";
import type { ReceiptApiOk, StoreLite, UploadRules } from "./types";
import styles from "./ReceiptUploader.module.css";

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
  const storeOf = (id: string | null) => stores.find((s) => s.id === id) ?? null;
  const store = storeOf(receipt.storeId);
  const giftNames = giftStoreIds.map((id) => storeOf(id)?.shortName ?? id);
  const items = read?.items.slice(0, 4) ?? [];
  const paidAt = receipt.receiptAt ? fmtDateTime(receipt.receiptAt) : read?.paidAt ? fmtOcrPaidAt(read.paidAt) : "판독 실패";
  const amount = receipt.amount ?? read?.amount ?? null;
  const shownReasons = receipt.reasons.filter((r) => !["MANUAL_APPROVED", "MANUAL_REJECTED"].includes(r.code));
  const status = receipt.status;

  const verdict =
    status === "approved"
      ? { label: "승인", cls: "status-ok", text: `${joinNames(giftNames)}에서 사이드 메뉴 1개를 선택할 수 있습니다. 쿠폰은 발급일부터 ${rules.couponValidDays}일간 유효합니다.` }
      : status === "review"
        ? { label: "직원 확인 대기", cls: "status-wait", text: "자동으로 판독하지 못한 항목이 있어 직원이 사진을 직접 확인합니다. 승인되면 쿠폰함에서 사이드 메뉴를 선택할 수 있습니다." }
        : { label: "반려", cls: "status-no", text: "이 영수증은 인정되지 않았습니다. 사유는 아래와 같습니다." };

  return (
    <div className={styles.result}>
      <p className="sr-only" aria-live="polite">영수증 판정: {verdict.label}</p>

      <div className={`paper ${styles.sheet}`}>
        <p className={styles.sheetTitle}>판독 결과</p>
        <dl className={styles.rows}>
          <div className={styles.row}><dt>매장</dt><dd>{store ? store.name : read?.merchant ? `${read.merchant} (미확인)` : "미확인"}</dd></div>
          <div className={styles.row}><dt>결제 일시</dt><dd className="mono">{paidAt}</dd></div>
          <div className={styles.row}><dt>결제 금액</dt><dd className="mono">{amount == null ? "판독 실패" : formatWon(amount)}</dd></div>
          <div className={styles.row}><dt>승인번호</dt><dd className="mono">{maskApproval(read?.approvalNo)}</dd></div>
          {items.length > 0 && (
            <div className={styles.row}>
              <dt>품목</dt>
              <dd>{items.map((it) => `${it.name}${it.qty && it.qty > 1 ? ` ×${it.qty}` : ""}`).join(", ")}{(read?.items.length ?? 0) > 4 ? " 외" : ""}</dd>
            </div>
          )}
          <div className={styles.row}><dt>접수 시각</dt><dd className="mono">{fmtDateTime(receipt.createdAt)}</dd></div>
        </dl>
        <hr className="dots" />
        <div className={styles.verdict} data-status={status}>
          <p><span className={`status ${verdict.cls}`}>{verdict.label}</span></p>
          <p className={styles.verdictText}>{verdict.text}</p>
          {shownReasons.length > 0 && status !== "approved" && (
            <ul className={styles.reasons} aria-label="사유">
              {shownReasons.map((r) => (
                <li key={r.code}>{r.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {status === "rejected" && (
        <div className={styles.hints}>
          <p className={styles.hintsTitle}>다시 촬영할 때</p>
          <ul>
            <li>영수증을 평평하게 펴고 네 귀퉁이가 모두 나오도록 촬영합니다.</li>
            <li>상호, 결제 일시, 금액, 승인번호 줄이 흐리지 않도록 가까이서 촬영합니다.</li>
            <li>화면 캡처, 재출력본, 주문서(빌지)는 인정하지 않습니다. 종이 원본만 인정합니다.</li>
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        {status === "approved" && (
          <Link href={`/pick/${receipt.id}`} className="btn btn-red btn-lg btn-block">사이드 메뉴 선택</Link>
        )}
        {status === "review" && (
          <>
            <Link href="/wallet" className="btn btn-lg btn-block">쿠폰함 보기</Link>
            <button type="button" className="btn btn-outline btn-block" onClick={onRetry}>다른 영수증 올리기</button>
          </>
        )}
        {status === "rejected" && (
          <>
            <button type="button" className="btn btn-red btn-lg btn-block" onClick={onRetry}>다시 촬영</button>
            <Link href="/guide" className="btn btn-outline btn-block">인정 기준 보기</Link>
          </>
        )}
      </div>
    </div>
  );
}
