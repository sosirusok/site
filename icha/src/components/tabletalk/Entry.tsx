"use client";
import { useState } from "react";
import type { Entry, JoinMode, OutWhy } from "@/lib/tabletalk/types";
import { hhmm, whyText } from "./words";
import s from "./tt.module.css";

type JoinEntry = Extract<Entry, { kind: "join" }>;

function Plate({ table }: { table: number }) {
  return (
    <p className={s.plate} aria-label={`${table}번 테이블`}>
      <span className={s.plateNo} aria-hidden="true">{table}</span>
      <span className={s.plateUnit} aria-hidden="true">번 테이블</span>
    </p>
  );
}

/**
 * QR 을 찍고 처음 보는 화면. 버튼을 눌러야 들어간다 — 카메라 앱·메신저가 주소를 미리 열어 보기만 해도 자리가 생기면 안 된다.
 *  - 열린 자리가 없으면 [테이블톡 시작]
 *  - 있으면 [일행으로 들어가기]. 그 자리 폰들이 10분 넘게 안 봤을 때만 [방금 이 자리에 앉았습니다](이전 대화를 닫고 새로)
 */
export function JoinScreen({ entry, onJoin }: { entry: JoinEntry; onJoin: (mode: JoinMode) => Promise<{ ok: boolean; code?: string; error?: string }> }) {
  const [busy, setBusy] = useState<JoinMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmFresh, setConfirmFresh] = useState(false);
  const ex = entry.existing;
  const notice = whyText(entry.why);

  async function go(mode: JoinMode) {
    setBusy(mode);
    setError(null);
    const r = await onJoin(mode);
    if (!r.ok) {
      setError(r.code === "exists" ? "그사이 이 테이블에 일행이 먼저 들어왔습니다. 화면을 새로 불러옵니다." : (r.error ?? "다시 눌러 주세요."));
      if (r.code === "exists") window.setTimeout(() => window.location.reload(), 1200);
      setBusy(null);
    }
  }

  return (
    <section className={s.entry}>
      <p className={s.kicker}>
        TABLE TALK<b>{entry.storeName}</b>
      </p>
      <Plate table={entry.table} />
      {notice && <p className={s.note}>{notice}</p>}
      {entry.elsewhere && (
        <p className={`${s.note} ${s.noteCyan}`}>
          이 폰은 지금 {entry.elsewhere.storeName} {entry.elsewhere.table}번 테이블에 들어가 있습니다. 여기로 들어오면 거기서는 나가집니다.
        </p>
      )}

      {!ex ? (
        <>
          <p className={s.lead}>같은 가게 다른 테이블에 말을 걸고, 받아 주면 두 테이블이 한 방에서 대화합니다. 일행 폰도 이 QR 을 찍으면 같이 들어옵니다.</p>
          <div className={s.actions}>
            <button type="button" className="btn btn-primary btn-lg btn-block" disabled={busy !== null} onClick={() => go("start")}>
              {busy ? "들어가는 중…" : "테이블톡 시작"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={s.lead}>
            {entry.table}번 테이블은 {hhmm(ex.since)}부터 테이블톡을 쓰고 있습니다.
            {ex.fresh ? " 같이 온 일행이면 바로 들어갑니다." : " 같이 온 일행이면 먼저 들어간 폰에서 [허락]을 누르면 들어갑니다."}
          </p>
          <div className={s.actions}>
            <button type="button" className="btn btn-primary btn-lg btn-block" disabled={busy !== null} onClick={() => go("team")}>
              {busy === "team" ? "들어가는 중…" : "일행으로 들어가기"}
            </button>
            {ex.quiet && !ex.fresh &&
              (confirmFresh ? (
                <div className={s.note}>
                  이전 손님의 대화를 모두 닫고 새로 시작합니다.
                  <div className="btn-row" style={{ marginTop: 10 }}>
                    <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => go("fresh")}>
                      {busy === "fresh" ? "닫는 중…" : "새로 시작"}
                    </button>
                    <button type="button" className={`${s.plainBtn} ${s.plainBtnSm}`} disabled={busy !== null} onClick={() => setConfirmFresh(false)}>
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmFresh(true)}>
                  방금 이 자리에 앉았습니다
                </button>
              ))}
          </div>
          {!ex.quiet && !ex.fresh && <p className={s.fine}>모르는 사람이 이 테이블로 쓰고 있다면 직원에게 말씀해 주세요.</p>}
        </>
      )}
      {error && (
        <p className={s.err} role="alert">
          {error}
        </p>
      )}
      <p className={s.fine}>로그인 없이 됩니다. 대화는 다음날 낮 12시에 닫히고, 이틀 안에 지워집니다.</p>
    </section>
  );
}

/** 일행 허락을 기다리는 화면 */
export function WaitingScreen({ storeName, table, onCancel, onFresh }: { storeName: string; table: number; onCancel: () => void; onFresh: () => Promise<void> }) {
  const [asking, setAsking] = useState(false);
  return (
    <section className={s.entry}>
      <p className={s.kicker}>
        TABLE TALK<b>{storeName}</b>
      </p>
      <Plate table={table} />
      <p className={s.say}>일행의 허락을 기다리는 중</p>
      <p className={s.lead}>{table}번 테이블에 먼저 들어간 폰에 알림이 갔습니다. 그 폰에서 [허락]을 누르면 바로 들어갑니다.</p>
      <span className={s.dots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <div className={s.actions}>
        <button type="button" className={s.plainBtn} onClick={onCancel}>
          그만두기
        </button>
        {asking ? (
          <div className={s.note}>
            일행이 아니라 방금 이 자리에 앉았다면, 이전 손님의 대화를 닫고 새로 시작할 수 있습니다. 이전 손님 폰이 10분 넘게 안 봤을 때만 됩니다.
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => void onFresh()}>
                새로 시작
              </button>
              <button type="button" className={`${s.plainBtn} ${s.plainBtnSm}`} onClick={() => setAsking(false)}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setAsking(true)}>
            일행이 아니라 방금 앉았습니다
          </button>
        )}
      </div>
    </section>
  );
}

/** 들어갈 수 없거나 나가진 화면 */
export function NoticeScreen({ kicker, title, text, why, again }: { kicker?: string; title: string; text?: string; why?: OutWhy | null; again?: boolean }) {
  const reason = whyText(why ?? null);
  return (
    <section className={s.entry}>
      <p className={s.kicker}>TABLE TALK{kicker ? <b>{kicker}</b> : null}</p>
      <p className={s.say}>{title}</p>
      {reason && <p className={s.note}>{reason}</p>}
      {text && <p className={s.lead}>{text}</p>}
      {again && (
        <div className={s.actions}>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => window.location.reload()}>
            다시 들어가기
          </button>
        </div>
      )}
    </section>
  );
}
