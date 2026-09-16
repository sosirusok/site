"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { decideReceiptAction, type ActionState } from "@/app/admin/actions";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/receipts/receipts.module.css";

export type DecisionReceipt = {
  id: string;
  status: "approved" | "review" | "rejected";
  storeId: string | null;
  amount: number | null;
  /** datetime-local 값(KST) */
  receiptAtLocal: string;
  reviewNote: string | null;
};

export function ReceiptDecisionForm({ receipt, stores, lockStore = null }: { receipt: DecisionReceipt; stores: { id: string; shortName: string }[]; /** 직원 계정: 이 매장으로 고정, 변경 불가 */ lockStore?: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(decideReceiptAction, null);
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const locked = receipt.status === "approved" || Boolean(state?.ok);

  return (
    <form action={action} className={ui.form}>
      <input type="hidden" name="receiptId" value={receipt.id} />
      <div className={ui.formRow}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="d-store">
            매장 (승인에 필요)
          </label>
          <select id="d-store" name="storeId" key={`store-${receipt.storeId ?? lockStore ?? ""}`} className={ui.select} defaultValue={receipt.storeId ?? lockStore ?? ""} disabled={locked || Boolean(lockStore)}>
            <option value="">— 읽지 못함 —</option>
            {stores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.shortName}
              </option>
            ))}
          </select>
          {lockStore ? (
            <>
              <input type="hidden" name="storeId" value={lockStore} />
              <span className={ui.help}>직원 계정은 자기 매장으로만 승인할 수 있습니다. 다른 매장 영수증이면 총괄 관리자에게 넘겨 주세요.</span>
            </>
          ) : null}
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="d-amount">
            결제 금액(원)
          </label>
          <input id="d-amount" name="amount" key={`amount-${receipt.amount ?? ""}`} className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" defaultValue={receipt.amount ?? ""} placeholder="예: 42000" disabled={locked} />
        </div>
      </div>
      <div className={ui.field}>
        <label className={ui.label} htmlFor="d-at">
          결제 일시 (한국 시간)
        </label>
        <input id="d-at" name="receiptAt" type="datetime-local" key={`at-${receipt.receiptAtLocal}`} className={`${ui.input} ${ui.inputMono}`} defaultValue={receipt.receiptAtLocal} disabled={locked} />
        <span className={ui.help}>사진에 찍힌 승인 일시를 그대로 적습니다. 비워 두면 읽은 값을 유지합니다.</span>
      </div>
      <div className={ui.field}>
        <label className={ui.label} htmlFor="d-note">
          메모 (반려 시 필수)
        </label>
        <textarea id="d-note" name="note" key={`note-${receipt.reviewNote ?? ""}`} className={ui.textarea} defaultValue={receipt.reviewNote ?? ""} placeholder="예: 승인번호가 접혀서 안 보임 / 다른 지점 영수증" disabled={locked} maxLength={300} />
      </div>
      {state ? (
        <p className={`${ui.notice} ${state.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
          {state.message}
        </p>
      ) : null}
      {locked ? (
        <p className={ui.help}>{receipt.status === "approved" ? "승인된 영수증은 다시 판정할 수 없습니다." : "판정이 끝났습니다."}</p>
      ) : (
        <div className={s.decisionBtns}>
          <button type="submit" name="decision" value="approve" className={`${ui.button} ${ui.buttonOk}`} disabled={pending}>
            {pending ? "처리 중…" : "승인"}
          </button>
          <button type="submit" name="decision" value="reject" className={`${ui.button} ${ui.buttonDanger}`} disabled={pending}>
            {pending ? "처리 중…" : "반려"}
          </button>
        </div>
      )}
      {!locked && receipt.status === "rejected" ? <p className={ui.help}>자동 반려된 건도 사진을 확인하고 승인으로 바꿀 수 있습니다.</p> : null}
    </form>
  );
}
