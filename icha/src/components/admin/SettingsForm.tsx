"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { recalcTiersAction, saveRulesAction, type ActionState } from "@/app/admin/actions";
import type { Rules } from "@/lib/config";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/settings/settings.module.css";

type TierRow = { key: string; name: string; minSpend: string; _k: number };

export function SettingsForm({ rules }: { rules: Rules }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRulesAction, null);
  const [rs, recalc, recalcPending] = useActionState<ActionState, FormData>(recalcTiersAction, null);
  const [tiers, setTiers] = useState<TierRow[]>(rules.tiers.map((t, i) => ({ key: t.key, name: t.name, minSpend: String(t.minSpend), _k: i })));
  useEffect(() => {
    if (state?.ok || rs?.ok) router.refresh();
  }, [state, rs, router]);

  const addTier = () => setTiers((t) => [...t, { key: "", name: "", minSpend: "", _k: Date.now() }]);
  const removeTier = (k: number) => setTiers((t) => t.filter((x) => x._k !== k));
  const upd = (k: number, patch: Partial<TierRow>) => setTiers((t) => t.map((x) => (x._k === k ? { ...x, ...patch } : x)));

  return (
    <>
      <form action={action} className={ui.form}>
        <div className={ui.grid2}>
          <section className={ui.panel}>
            <div className={ui.panelHead}>
              <h2 className={ui.panelTitle}>영수증 인정</h2>
            </div>
            <div className={`${ui.panelBody} ${ui.form}`}>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-hours">
                  결제 후 인정 시간
                </label>
                <div className={s.numUnit}>
                  <input id="st-hours" name="receiptValidHours" type="number" min={1} max={720} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.receiptValidHours} required />
                  <span>시간</span>
                </div>
                <span className={ui.help}>영수증에 찍힌 결제 시각부터. 24면 "오늘 1차, 오늘·내일 2차"가 됩니다.</span>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-min">
                  최소 결제 금액
                </label>
                <div className={s.numUnit}>
                  <input id="st-min" name="minAmount" type="number" min={0} max={1000000} step={1000} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.minAmount} required />
                  <span>원 (0이면 제한 없음)</span>
                </div>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-max">
                  자동 승인 상한 금액
                </label>
                <div className={s.numUnit}>
                  <input id="st-max" name="maxAutoAmount" type="number" min={0} max={50000000} step={10000} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.maxAutoAmount} required />
                  <span>원 (0이면 제한 없음)</span>
                </div>
                <span className={ui.help}>이 금액을 넘는 결제는 자동 승인하지 않고 "확인 대기"로 넘깁니다. 금액 오독으로 등급이 뛰는 것을 막습니다.</span>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-daily">
                  회원 1명당 하루 인증 한도
                </label>
                <div className={s.numUnit}>
                  <input id="st-daily" name="dailyLimitPerMember" type="number" min={1} max={20} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.dailyLimitPerMember} required />
                  <span>회 (승인·확인 대기 기준)</span>
                </div>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-attempts">
                  회원 1명당 하루 업로드 시도 한도
                </label>
                <div className={s.numUnit}>
                  <input id="st-attempts" name="dailyAttemptLimit" type="number" min={0} max={100} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.dailyAttemptLimit} required />
                  <span>회 (반려 포함, 0이면 제한 없음)</span>
                </div>
                <span className={ui.help}>아무 사진이나 계속 올려 자동 인식 비용을 태우는 것을 막습니다. 넘으면 인식 없이 바로 반려합니다.</span>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-days">
                  쿠폰 유효 기간
                </label>
                <div className={s.numUnit}>
                  <input id="st-days" name="couponValidDays" type="number" min={1} max={365} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.couponValidDays} required />
                  <span>일 (발급일부터, 그날 23:59까지)</span>
                </div>
                <span className={ui.help}>승인된 영수증으로 사이드를 고를 수 있는 기간도 같습니다(승인일부터).</span>
              </div>
            </div>
          </section>

          <section className={ui.panel}>
            <div className={ui.panelHead}>
              <h2 className={ui.panelTitle}>자동 판정 민감도</h2>
            </div>
            <div className={`${ui.panelBody} ${ui.form}`}>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-sim">
                  유사 사진 판정 거리
                </label>
                <div className={s.numUnit}>
                  <input id="st-sim" name="similarHashThreshold" type="number" min={0} max={64} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.similarHashThreshold} required />
                  <span>0~64</span>
                </div>
                <span className={ui.help}>작을수록 엄격합니다. 같은 영수증을 각도만 바꿔 다시 찍은 사진을 잡는 값. 보통 6~10.</span>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-conf">
                  자동 승인에 필요한 인식 신뢰도
                </label>
                <div className={s.numUnit}>
                  <input id="st-conf" name="minConfidence" type="number" min={0} max={100} className={`${ui.input} ${ui.inputMono}`} defaultValue={Math.round(rules.minConfidence * 100)} required />
                  <span>% 미만이면 직원 확인</span>
                </div>
                <span className={ui.help}>상호·일시·금액 중 하나라도 이 값보다 낮게 읽히면 자동 승인하지 않고 "확인 대기"로 넘깁니다. 승인번호가 없거나 흐린 영수증은 이 값과 관계없이 직원 확인으로 갑니다.</span>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-ocr">
                  사이트 전체 하루 자동 인식 상한
                </label>
                <div className={s.numUnit}>
                  <input id="st-ocr" name="dailyOcrLimit" type="number" min={0} max={100000} step={50} className={`${ui.input} ${ui.inputMono}`} defaultValue={rules.dailyOcrLimit} required />
                  <span>회 (0이면 제한 없음)</span>
                </div>
                <span className={ui.help}>자동 인식 한 번이 곧 API 비용입니다. 하루 이 횟수를 넘으면 인식을 멈추고 모든 영수증을 "확인 대기"로 받습니다. 세 매장 합쳐 하루 100~200장이면 500이 넉넉합니다.</span>
              </div>
              <div className={ui.field}>
                <label className={ui.check}>
                  <input type="checkbox" name="eventActive" defaultChecked={rules.eventActive} /> 이벤트 진행 중 (끄면 인증을 받지 않고 안내만 보입니다)
                </label>
              </div>
              <div className={ui.field}>
                <label className={ui.label} htmlFor="st-notice">
                  손님 화면 상단 공지
                </label>
                <textarea id="st-notice" name="notice" className={ui.textarea} defaultValue={rules.notice} maxLength={200} placeholder="예: 9월 30일까지 도쿄스탠드는 점검으로 쿠폰 사용이 어렵습니다." style={{ minHeight: 64 }} />
                <span className={ui.help}>비워 두면 띠가 사라집니다. 홈과 쿠폰함 상단에 얇게 보입니다.</span>
              </div>
            </div>
          </section>
        </div>

        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>등급</h2>
            <span className={ui.panelNote}>누적 결제 금액이 기준 이상이면 그 등급. 기준이 낮은 순으로 자동 정렬</span>
          </div>
          <div className={ui.panelBody}>
            <table className={s.tierTable}>
              <thead>
                <tr>
                  <th>키 (영문, 고정)</th>
                  <th>이름 (손님에게 보임)</th>
                  <th>기준 금액(원)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t._k}>
                    <td>
                      <input name="tierKey" className={`${ui.input} ${ui.inputMono}`} value={t.key} onChange={(e) => upd(t._k, { key: e.target.value })} placeholder="regular" aria-label="등급 키" />
                    </td>
                    <td>
                      <input name="tierName" className={ui.input} value={t.name} onChange={(e) => upd(t._k, { name: e.target.value })} placeholder="단골" aria-label="등급 이름" />
                    </td>
                    <td>
                      <input name="tierMin" className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" value={t.minSpend} onChange={(e) => upd(t._k, { minSpend: e.target.value })} placeholder="100000" aria-label="기준 금액" />
                    </td>
                    <td>
                      <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={() => removeTier(t._k)} aria-label={`${t.name || "등급"} 삭제`} disabled={tiers.length <= 1}>
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={ui.inline} style={{ marginTop: 10 }}>
              <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={addTier}>
                등급 행 추가
              </button>
              <span className={ui.help}>키를 바꾸면 그 키로 저장된 회원 등급이 "일반"으로 보이므로, 저장 뒤 아래 재계산을 눌러 주세요.</span>
            </div>
          </div>
        </section>

        <div className={s.sticky}>
          <button type="submit" className={ui.button} disabled={pending}>
            {pending ? "저장 중…" : "규칙 저장"}
          </button>
          {state ? (
            <span className={`${ui.notice} ${state.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
              {state.message}
            </span>
          ) : null}
        </div>
      </form>

      <section className={ui.panel} style={{ marginTop: 16 }}>
        <div className={ui.panelHead}>
          <h2 className={ui.panelTitle}>기존 회원 등급 재계산</h2>
        </div>
        <div className={`${ui.panelBody} ${ui.form}`}>
          <p className={ui.small}>등급 기준을 바꿨을 때 모든 회원의 누적 금액으로 등급을 다시 매깁니다. 쿠폰이나 금액은 바뀌지 않습니다.</p>
          <form
            action={recalc}
            onSubmit={(e) => {
              if (!window.confirm("모든 회원의 등급을 현재 기준으로 다시 계산할까요?")) e.preventDefault();
            }}
          >
            <button type="submit" className={`${ui.button} ${ui.buttonGhost}`} disabled={recalcPending}>
              {recalcPending ? "계산 중…" : "지금 재계산"}
            </button>
          </form>
          {rs ? (
            <p className={`${ui.notice} ${rs.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
              {rs.message}
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
