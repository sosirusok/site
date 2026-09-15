"use client";
import { useActionState } from "react";
import { saveMemberMemoAction, type ActionState } from "@/app/admin/actions";
import ui from "@/app/admin/admin.module.css";

export function MemberMemoForm({ memberId, memo }: { memberId: string; memo: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveMemberMemoAction, null);
  return (
    <form action={action} className={ui.form}>
      <input type="hidden" name="memberId" value={memberId} />
      <label className={ui.label} htmlFor="memo">
        직원용 메모 (손님에게 보이지 않음)
      </label>
      <textarea id="memo" name="memo" className={ui.textarea} defaultValue={memo ?? ""} maxLength={500} placeholder="예: 단체 예약 자주 함 / 영수증 분쟁 있었음" />
      {state ? (
        <p className={`${ui.notice} ${state.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className={`${ui.button} ${ui.buttonGhost}`} disabled={pending}>
          {pending ? "저장 중…" : "메모 저장"}
        </button>
      </div>
    </form>
  );
}
