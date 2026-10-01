"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ttClearAction, ttLockAction, ttRegenAction, ttResolveAction, ttSettingsAction, type ActionState } from "@/app/admin/actions";
import type { AdminReport, AdminSeat } from "@/lib/tabletalk/service";
import ui from "@/app/admin/admin.module.css";

type Props = {
  store: string;
  storeName: string;
  seats: AdminSeat[];
  locks: number[];
  reports: AdminReport[];
  settings: { on: boolean; tables: number; gen: number };
  owner: boolean;
  usage: { used30: number; today: number; budget: number; pace: number; closed: boolean } | null;
};

const hm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const minsAgo = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

/**
 * 테이블톡 관리 — 지금 켜진 테이블 · 신고 · (총괄) 설정·사용량.
 * 보고 있는 동안 90초마다 새로 불러온다(손님 화면처럼 자주 묻지 않는다 — 무료 요금제 한도).
 */
export function TableTalkAdmin(p: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<ActionState>(null);
  const [pending, start] = useTransition();
  const [lockNo, setLockNo] = useState("");

  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 90_000);
    return () => window.clearInterval(t);
  }, [router]);

  function act(fn: (prev: ActionState, fd: FormData) => Promise<ActionState>, fields: Record<string, string>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    const fd = new FormData();
    fd.set("store", p.store);
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    start(async () => {
      setMsg(await fn(null, fd));
      router.refresh();
    });
  }

  const open = p.reports.filter((r) => !r.resolved);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {msg ? (
        <p className={`${ui.notice} ${msg.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
          {msg.message}
        </p>
      ) : null}
      {!p.settings.on && <p className={`${ui.notice} ${ui.noticeWarn}`}>{p.storeName} 테이블톡이 꺼져 있습니다. 손님이 QR 을 찍어도 들어오지 못합니다.</p>}

      {open.length > 0 && (
        <section className={`${ui.panel} ${ui.panelBody}`}>
          <h2 className={ui.sectionTitle}>신고 {open.length}건</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {open.map((r) => (
              <div key={r.id} style={{ display: "grid", gap: 8, paddingBottom: 12, borderBottom: "1px solid var(--a-line-2)" }}>
                <div className={ui.inline}>
                  <span className={`${ui.badge} ${ui.badgeBad}`}>신고</span>
                  <b>
                    {r.byTable}번 테이블이 {r.onTable}번 테이블을 신고
                  </b>
                  <span className={ui.help}>{hm(r.at)}</span>
                </div>
                {r.lines.length > 0 ? (
                  <pre className={ui.pre}>{r.lines.map((l) => `${hm(l.at)}  ${l.table}번  ${l.body}`).join("\n")}</pre>
                ) : (
                  <p className={ui.help}>오간 글이 없습니다(말 걸기 단계에서 신고).</p>
                )}
                <div className={ui.inline}>
                  <button type="button" className={`${ui.button} ${ui.buttonDanger} ${ui.buttonSm}`} disabled={pending} onClick={() => act(ttClearAction, { table: String(r.onTable) }, `${r.onTable}번 테이블 대화를 비울까요? 그 테이블 폰들이 모두 나가집니다.`)}>
                    {r.onTable}번 비우기
                  </button>
                  <button type="button" className={`${ui.button} ${ui.buttonDanger} ${ui.buttonSm}`} disabled={pending} onClick={() => act(ttLockAction, { table: String(r.onTable), on: "1" }, `${r.onTable}번 테이블을 오늘 막을까요? 오늘 영업이 끝날 때까지 그 테이블은 테이블톡에 못 들어옵니다.`)}>
                    {r.onTable}번 오늘 막기
                  </button>
                  <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} disabled={pending} onClick={() => act(ttResolveAction, { id: r.id })}>
                    처리 완료
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={ui.panel}>
        <div className={ui.panelBody} style={{ paddingBottom: 0 }}>
          <h2 className={ui.sectionTitle}>지금 켜진 테이블 {p.seats.length}곳</h2>
          <p className={ui.help}>손님이 나갔는데 남아 있으면 [비우기]. 다음 손님이 앉기 전에 비워 두면 새 손님이 바로 시작합니다.</p>
        </div>
        {p.seats.length === 0 ? (
          <p className={ui.panelBody} style={{ color: "var(--a-ink-3)" }}>
            켜진 테이블이 없습니다.
          </p>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>테이블</th>
                  <th>시작</th>
                  <th>마지막으로 봄</th>
                  <th className={ui.num}>폰</th>
                  <th>대화 중</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {p.seats.map((t) => (
                  <tr key={t.seat}>
                    <td>
                      <b>{t.table}번</b>
                    </td>
                    <td className={ui.mono}>{hm(t.since)}</td>
                    <td className={ui.mono}>{minsAgo(t.seen) < 1 ? "방금" : `${minsAgo(t.seen)}분 전`}</td>
                    <td className={ui.num}>
                      {t.phones}
                      {t.waiting ? <span className={ui.dim}> +{t.waiting} 대기</span> : null}
                    </td>
                    <td>{t.talkingWith.length ? t.talkingWith.map((n) => `${n}번`).join(", ") : <span className={ui.dim}>없음</span>}</td>
                    <td>
                      <div className={ui.inline} style={{ flexWrap: "nowrap" }}>
                        <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} disabled={pending} onClick={() => act(ttClearAction, { table: String(t.table) }, `${t.table}번 테이블 대화를 비울까요? 그 테이블 폰들이 모두 나가집니다.`)}>
                          비우기
                        </button>
                        <button type="button" className={`${ui.button} ${ui.buttonDanger} ${ui.buttonSm}`} disabled={pending} onClick={() => act(ttLockAction, { table: String(t.table), on: "1" }, `${t.table}번 테이블을 오늘 막을까요?`)}>
                          오늘 막기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={ui.panelBody} style={{ borderTop: "1px solid var(--a-line-2)", display: "grid", gap: 10 }}>
          <div className={ui.inline}>
            <span className={ui.small}>오늘 막은 테이블:</span>
            {p.locks.length === 0 ? <span className={ui.dim}>없음</span> : null}
            {p.locks.map((n) => (
              <button key={n} type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} disabled={pending} onClick={() => act(ttLockAction, { table: String(n), on: "0" })}>
                {n}번 풀기
              </button>
            ))}
          </div>
          <form
            className={ui.inlineForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (lockNo) act(ttLockAction, { table: lockNo, on: "1" });
              setLockNo("");
            }}
          >
            <label className={ui.field}>
              <span className={ui.label}>테이블 번호 막기</span>
              <input className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" value={lockNo} onChange={(e) => setLockNo(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="예: 7" />
            </label>
            <button type="submit" className={`${ui.button} ${ui.buttonDanger}`} disabled={pending || !lockNo}>
              오늘 막기
            </button>
          </form>
        </div>
      </section>

      {p.reports.some((r) => r.resolved) && (
        <section className={`${ui.panel} ${ui.panelBody}`}>
          <h2 className={ui.sectionTitle}>처리한 신고 (24시간)</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }} className={ui.small}>
            {p.reports
              .filter((r) => r.resolved)
              .map((r) => (
                <li key={r.id}>
                  {hm(r.at)} · {r.byTable}번 → {r.onTable}번
                </li>
              ))}
          </ul>
        </section>
      )}

      {p.owner && (
        <section className={`${ui.panel} ${ui.panelBody}`} style={{ display: "grid", gap: 12 }}>
          <h2 className={ui.sectionTitle}>설정 · {p.storeName}</h2>
          <form
            className={ui.inlineForm}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              act(ttSettingsAction, { on: fd.get("on") ? "1" : "0", tables: String(fd.get("tables") ?? "") });
            }}
          >
            <label className={ui.check}>
              <input type="checkbox" name="on" defaultChecked={p.settings.on} />
              테이블톡 켜기
            </label>
            <label className={ui.field}>
              <span className={ui.label}>테이블 수</span>
              <input className={`${ui.input} ${ui.inputMono}`} name="tables" inputMode="numeric" defaultValue={p.settings.tables} />
            </label>
            <button type="submit" className={ui.button} disabled={pending}>
              저장
            </button>
          </form>
          <p className={ui.help}>테이블 수만큼 손님 번호판에 칸이 생기고, 인쇄물 → 테이블 QR 에 그만큼 QR 이 나옵니다. 테이블 번호는 가게에 붙인 번호와 같아야 합니다.</p>
          <div className={ui.inline}>
            <button
              type="button"
              className={`${ui.button} ${ui.buttonDanger} ${ui.buttonSm}`}
              disabled={pending}
              onClick={() => act(ttRegenAction, {}, "QR 을 새로 만들까요? 지금 붙어 있는 이 매장 테이블 QR 은 모두 열리지 않게 됩니다. QR 사진이 밖으로 퍼졌을 때만 쓰세요.")}
            >
              QR 새로 만들기
            </button>
            <span className={ui.help}>지금 판: {p.settings.gen}</span>
          </div>
        </section>
      )}

      {p.usage && (
        <section className={`${ui.panel} ${ui.panelBody}`}>
          <h2 className={ui.sectionTitle}>사용량 (세 매장 합계)</h2>
          <dl className={ui.kv}>
            <dt>최근 30일 요청</dt>
            <dd className={ui.mono}>
              {p.usage.used30.toLocaleString("ko-KR")} / {p.usage.budget.toLocaleString("ko-KR")}
            </dd>
            <dt>오늘</dt>
            <dd className={ui.mono}>{p.usage.today.toLocaleString("ko-KR")}</dd>
            <dt>지금 속도</dt>
            <dd>{p.usage.closed ? "새 글 멈춤(예산 거의 다 씀)" : p.usage.pace <= 1 ? "보통" : `${p.usage.pace}배 느리게 새로고침`}</dd>
          </dl>
          <p className={ui.help} style={{ marginTop: 8 }}>
            무료 요금제(Vercel Hobby)는 한 달 요청이 100만 번을 넘으면 사이트 전체가 30일 멈춥니다. 테이블톡은 그 한도의 45%까지만 쓰도록 스스로 느려집니다.
          </p>
        </section>
      )}
    </div>
  );
}
