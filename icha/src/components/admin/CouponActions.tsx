"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { redeemCouponAction, voidCouponAction, type ActionState } from "@/app/admin/actions";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/coupons/coupons.module.css";

export function CouponActions({ couponId, status, canRedeem, redeemBlockedReason, canVoid }: { couponId: string; status: string; canRedeem: boolean; redeemBlockedReason: string | null; canVoid: boolean }) {
  const router = useRouter();
  const [rs, redeem, redeeming] = useActionState<ActionState, FormData>(redeemCouponAction, null);
  const [vs, doVoid, voiding] = useActionState<ActionState, FormData>(voidCouponAction, null);
  useEffect(() => {
    if (rs?.ok || vs?.ok) router.refresh();
  }, [rs, vs, router]);
  const done = Boolean(rs?.ok || vs?.ok);
  const msg = [rs, vs].filter(Boolean).sort((a, b) => (b?.at ?? 0) - (a?.at ?? 0))[0];

  if (status !== "active" && !done) return null;
  return (
    <div className={ui.stack} style={{ gap: 10 }}>
      {msg ? (
        <p className={`${ui.notice} ${msg.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
          {msg.message}
        </p>
      ) : null}
      {!done ? (
        <div className={s.actions}>
          <form action={redeem}>
            <input type="hidden" name="couponId" value={couponId} />
            <button type="submit" className={`${ui.button} ${ui.buttonOk} ${ui.buttonLg}`} disabled={!canRedeem || redeeming || voiding}>
              {redeeming ? "처리 중…" : "사용 처리"}
            </button>
          </form>
          {redeemBlockedReason ? <p className={`${ui.notice} ${ui.noticeWarn}`}>{redeemBlockedReason}</p> : null}
          {canVoid ? (
            <form action={doVoid} className={s.voidForm}>
              <input type="hidden" name="couponId" value={couponId} />
              <input name="note" className={ui.input} placeholder="취소 사유 (예: 이중 발급)" required maxLength={100} />
              <button type="submit" className={`${ui.button} ${ui.buttonDanger}`} disabled={redeeming || voiding}>
                {voiding ? "처리 중…" : "쿠폰 취소"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
