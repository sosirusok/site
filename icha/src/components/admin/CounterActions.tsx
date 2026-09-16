"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { counterIssueAction, counterRedeemAction, type ActionState } from "@/app/admin/actions";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/counter/counter.module.css";

export type CounterCoupon = { id: string; code: string; menuName: string; expires: string; kindLabel: string };
export type CounterPending = { id: string; storeName: string; when: string };
export type CounterGift = { id: number; name: string; price: number | null };

/**
 * 카운터의 두 동작 — (a) 이 손님에게 쿠폰 주기, (b) 여기서 사용 처리.
 * 결과는 위쪽에 초록 큰 글자로 남고, 목록은 router.refresh() 로 새로 읽는다.
 */
export function CounterActions({
  phone,
  storeId,
  storeName,
  memberId,
  eventActive,
  usableAtNames,
  usable,
  pending,
  gifts,
}: {
  phone: string;
  storeId: string;
  storeName: string;
  memberId: string | null;
  eventActive: boolean;
  usableAtNames: string;
  usable: CounterCoupon[];
  pending: CounterPending[];
  gifts: CounterGift[];
}) {
  const router = useRouter();
  const [is, issue, issuing] = useActionState<ActionState, FormData>(counterIssueAction, null);
  const [rs, redeem, redeeming] = useActionState<ActionState, FormData>(counterRedeemAction, null);
  const [receiptId, setReceiptId] = useState(pending[0]?.id ?? "");
  const [giftId, setGiftId] = useState(gifts[0]?.id ?? 0);
  useEffect(() => {
    if (is?.ok || rs?.ok) router.refresh();
  }, [is, rs, router]);
  useEffect(() => {
    if (!pending.some((p) => p.id === receiptId)) setReceiptId(pending[0]?.id ?? "");
  }, [pending, receiptId]);
  const busy = issuing || redeeming;
  const last = [is, rs].filter(Boolean).sort((a, b) => (b?.at ?? 0) - (a?.at ?? 0))[0] ?? null;

  return (
    <div className={ui.stack}>
      {last ? (
        last.ok ? (
          <p className={s.result} role="status" aria-live="polite">
            <span className={s.resultMark} aria-hidden="true">
              ✓
            </span>
            {last.message}
          </p>
        ) : (
          <p className={`${ui.notice} ${ui.noticeBad} ${s.resultBad}`} role="alert">
            {last.message}
          </p>
        )
      ) : null}

      <div className={s.twoCol}>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>쿠폰 주기</h2>
            <span className={ui.panelNote}>{storeName}에서 계산한 손님</span>
          </div>
          <form action={issue} className={`${ui.panelBody} ${ui.form}`}>
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="storeId" value={storeId} />
            <div className={ui.field}>
              <label className={ui.label} htmlFor="counter-amount">
                결제 금액 <span className={ui.dim}>(선택)</span>
              </label>
              <input id="counter-amount" name="amount" className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" placeholder="비워 둬도 됩니다" autoComplete="off" disabled={!eventActive || busy} />
            </div>
            <button type="submit" className={`${ui.button} ${s.bigButton} ${ui.buttonBlock}`} disabled={!eventActive || busy}>
              {issuing ? "넣는 중…" : "이 손님에게 쿠폰 주기"}
            </button>
            <p className={ui.help}>{eventActive ? `${storeName} 이름으로 들어가고, ${usableAtNames}에서 쓸 수 있습니다.` : "지금은 이벤트 기간이 아니라 쿠폰을 줄 수 없습니다. 설정에서 이벤트를 켜세요."}</p>
          </form>
        </section>

        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>여기서 사용 처리</h2>
            <span className={ui.panelNote}>{storeName} 혜택</span>
          </div>
          <div className={`${ui.panelBody} ${ui.stack}`}>
            {usable.length === 0 && pending.length === 0 ? <p className={ui.empty}>이 번호에는 {storeName}에서 쓸 쿠폰이 없습니다.</p> : null}

            {usable.map((c) => (
              <form key={c.id} action={redeem} className={s.couponRow}>
                <input type="hidden" name="storeId" value={storeId} />
                <input type="hidden" name="couponId" value={c.id} />
                <div className={s.couponText}>
                  <span className={s.couponMenu}>{c.menuName}</span>
                  <span className={`${ui.dim} ${ui.small}`}>
                    <span className={ui.mono}>{c.code}</span> · {c.kindLabel} · {c.expires}까지
                  </span>
                </div>
                <button type="submit" className={`${ui.button} ${ui.buttonOk} ${s.bigButton}`} disabled={busy}>
                  {redeeming ? "처리 중…" : "사용 처리"}
                </button>
              </form>
            ))}

            {pending.length > 0 && memberId ? (
              <form action={redeem} className={`${ui.form} ${s.pendingForm}`}>
                <input type="hidden" name="storeId" value={storeId} />
                <input type="hidden" name="memberId" value={memberId} />
                {pending.length === 1 ? <input type="hidden" name="receiptId" value={pending[0]!.id} /> : null}
                <div className={ui.field}>
                  <span className={ui.label}>받은 릴레이 {pending.length}건</span>
                  {pending.length === 1 ? (
                    <span className={ui.small}>
                      {pending[0]!.storeName}에서 {pending[0]!.when}에 받음
                    </span>
                  ) : (
                    <div className={s.giftList} role="radiogroup" aria-label="사용할 릴레이">
                      {pending.map((p) => (
                        <label key={p.id} className={s.giftOpt}>
                          <input type="radio" name="receiptId" value={p.id} checked={receiptId === p.id} onChange={() => setReceiptId(p.id)} />
                          <span>
                            {p.storeName} · {p.when}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className={ui.field}>
                  <span className={ui.label}>{storeName} 혜택 품목</span>
                  {gifts.length === 0 ? (
                    <p className={`${ui.notice} ${ui.noticeWarn}`}>{storeName}에 혜택 품목이 없습니다. 메뉴에서 '무료 증정'을 켜 주세요.</p>
                  ) : (
                    <div className={s.giftList} role="radiogroup" aria-label="혜택 품목">
                      {gifts.map((g) => (
                        <label key={g.id} className={s.giftOpt}>
                          <input type="radio" name="menuItemId" value={g.id} checked={giftId === g.id} onChange={() => setGiftId(g.id)} />
                          <span className={s.giftName}>{g.name}</span>
                          {g.price != null ? <span className={`${ui.dim} ${ui.mono}`}>{g.price.toLocaleString("ko-KR")}원</span> : null}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className={`${ui.button} ${ui.buttonOk} ${s.bigButton} ${ui.buttonBlock}`} disabled={busy || gifts.length === 0}>
                  {redeeming ? "처리 중…" : "여기서 사용 처리"}
                </button>
                <p className={ui.help}>고른 품목으로 쿠폰이 만들어지고 바로 사용 처리됩니다. 되돌릴 수 없습니다.</p>
              </form>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
