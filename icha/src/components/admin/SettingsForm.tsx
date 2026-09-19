"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { saveRulesAction, type ActionState } from "@/app/admin/actions";
import type { Rules } from "@/lib/config";
import { STORES } from "@/lib/stores";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/settings/settings.module.css";

/** 1차 → 2차 → 3차 순서로 세 매장 */
const ORDERED = [...STORES].sort((a, b) => a.course.n - b.course.n);

/** 운영 규칙 — 카운터 발급 방식에서 실제로 쓰는 값만 보인다 (쿠폰·진행·공지·매장 소식·리뷰 이벤트). */
export function SettingsForm({ rules }: { rules: Rules }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRulesAction, null);
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className={ui.form}>
      <div className={ui.grid2}>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>쿠폰</h2>
          </div>
          <div className={`${ui.panelBody} ${ui.form}`}>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="st-days">
                쿠폰 유효 기간
              </label>
              <div className={s.numUnit}>
                <input id="st-days" name="couponValidDays" type="number" min={1} max={365} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.couponValidDays} required />
                <span>일 (받은 날부터, 그날 23:59까지)</span>
              </div>
              <span className={ui.help}>받은 릴레이로 다른 매장 혜택을 고를 수 있는 기간도 같습니다.</span>
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="st-daily">
                번호 하나당 하루 한도
              </label>
              <div className={s.numUnit}>
                <input id="st-daily" name="dailyLimitPerMember" type="number" min={1} max={20} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.dailyLimitPerMember} required />
                <span>장 (한 매장 카운터 기준)</span>
              </div>
              <span className={ui.help}>포스터의 "테이블당 1회"를 지키려면 1로 둡니다. 같은 번호가 같은 매장에서 하루에 받을 수 있는 수입니다.</span>
            </div>
          </div>
        </section>

        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>진행 · 공지</h2>
          </div>
          <div className={`${ui.panelBody} ${ui.form}`}>
            <div className={ui.field}>
              <label className={ui.check}>
                <input type="checkbox" name="eventActive" defaultChecked={rules.eventActive} /> 이벤트 진행 중
              </label>
              <span className={ui.help}>끄면 카운터에서 쿠폰을 줄 수 없고, 손님 사이트에는 안내만 보입니다. 이미 준 쿠폰은 그대로 쓸 수 있습니다.</span>
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="st-start">
                이벤트 기간
              </label>
              <div className={s.numUnit}>
                <input id="st-start" name="eventStart" type="date" className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.eventStart} />
                <span>~</span>
                <input id="st-end" name="eventEnd" type="date" className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.eventEnd} />
              </div>
              <span className={ui.help}>비워 두면 손님 화면에 "상시 운영 · 종료일은 매장 공지"로 나갑니다. 날짜를 넣으면 홈과 이용 안내에 그 기간이 그대로 보입니다.</span>
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="st-notice">
                손님 화면 상단 공지
              </label>
              <textarea id="st-notice" name="notice" className={ui.textarea} defaultValue={rules.notice} maxLength={200} placeholder="예: 9월 30일까지 도쿄스탠드는 점검으로 쿠폰 사용이 어렵습니다." style={{ minHeight: 64 }} />
              <span className={ui.help}>비워 두면 띠가 사라집니다. 홈과 쿠폰함 상단에 한 줄로 보입니다.</span>
            </div>
          </div>
        </section>
      </div>

      <div className={ui.grid2}>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>매장 소식</h2>
            <span className={ui.panelNote}>매장마다 한 줄</span>
          </div>
          <div className={`${ui.panelBody} ${ui.form}`}>
            {ORDERED.map((st) => (
              <div key={st.id} className={ui.field}>
                <label className={`${ui.label} ${s.storeLabel}`} htmlFor={`st-notice-${st.id}`} data-store={st.id}>
                  <span className={ui.storeDot} aria-hidden="true" />
                  {st.course.n}차 {st.shortName}
                </label>
                <textarea
                  id={`st-notice-${st.id}`}
                  name={`storeNotice_${st.id}`}
                  className={`${ui.textarea} ${s.lineInput}`}
                  defaultValue={rules.storeNotices[st.id] ?? ""}
                  maxLength={80}
                  placeholder="예: 오늘 하이볼 1+1"
                />
              </div>
            ))}
            <span className={ui.help}>손님 홈 매장 카드와 매장 화면에 한 줄로 보입니다. 비우면 숨깁니다.</span>
          </div>
        </section>

        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>리뷰 이벤트</h2>
            <span className={ui.panelNote}>네이버 리뷰 혜택</span>
          </div>
          <div className={`${ui.panelBody} ${ui.form}`}>
            {ORDERED.map((st) => (
              <div key={st.id} className={ui.field}>
                <label className={`${ui.label} ${s.storeLabel}`} htmlFor={`st-review-${st.id}`} data-store={st.id}>
                  <span className={ui.storeDot} aria-hidden="true" />
                  {st.course.n}차 {st.shortName}
                </label>
                <input
                  id={`st-review-${st.id}`}
                  name={`reviewBenefit_${st.id}`}
                  className={ui.input}
                  defaultValue={rules.reviewBenefit[st.id] ?? ""}
                  maxLength={40}
                  placeholder="예: 리뷰 보여 주면 소주 1병"
                  autoComplete="off"
                />
              </div>
            ))}
            <span className={ui.help}>네이버 리뷰를 쓴 손님에게 주는 혜택. 손님 홈 '리뷰 쓰기' 줄에 보입니다. 비우면 기본 문구만 보입니다.</span>
          </div>
        </section>
      </div>

      <div className={s.sticky}>
        <button type="submit" className={`${ui.button} ${ui.buttonLg}`} disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </button>
        {state ? (
          <span className={`${ui.notice} ${state.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
