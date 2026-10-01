"use client";
import { useEffect, useState } from "react";
import type { Msg, Tile, TTState } from "@/lib/tabletalk/types";
import { NOTE_MAX } from "@/lib/tabletalk/text";
import { Sheet } from "./Sheet";
import { ago, hhmm, sysText, TILE_NOTE } from "./words";
import s from "./tt.module.css";

type Op = (name: string, payload?: Record<string, unknown>) => Promise<{ ok: boolean; code?: string }>;

/** 1분마다 다시 그려 "3분 전"이 맞게 */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

const TILE_TAG: Partial<Record<Tile["state"], string>> = { me: "우리", sent: "신청함", got: "신청 옴", talk: "대화", wait: "잠시" };

/**
 * 번호판 화면 — 위에서부터: 들어오려는 우리 일행 폰 · 받은 신청 · 대화 목록 · 테이블 번호판.
 * 번호판은 테이블에 붙은 번호 그대로라, 고개를 들어 그 테이블을 보고 번호를 누르면 된다.
 */
export function Lobby({
  state, msgs, unread, closed, op, onOpen, onToast,
}: {
  state: TTState;
  msgs: Msg[];
  unread: (room: string) => number;
  closed: boolean;
  op: Op;
  onOpen: (room: string) => void;
  onToast: (text: string) => void;
}) {
  const now = useNow();
  const [askTo, setAskTo] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [sentFor, setSentFor] = useState<{ no: number; ask: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, name: string, payload: Record<string, unknown>) {
    if (busy) return false;
    setBusy(key);
    const r = await op(name, payload);
    setBusy(null);
    return r.ok;
  }

  function onTile(t: Tile) {
    if (t.state === "on") {
      setNote("");
      setAskTo(t.no);
    } else if (t.state === "talk" && t.room) onOpen(t.room);
    else if (t.state === "got") document.getElementById(`ask-${t.ask}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (t.state === "sent" && t.ask) setSentFor({ no: t.no, ask: t.ask });
    else if (t.state === "empty" || t.state === "wait" || t.state === "off") onToast(TILE_NOTE[t.state](t.no));
  }

  const lastOf = (room: string) => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i]!;
      if (m.room === room) return m;
    }
    return null;
  };

  const anyoneElse = state.tiles.some((t) => t.state !== "me" && t.state !== "empty");
  const openRooms = state.rooms.filter((r) => r.open);
  const shownRooms = [...openRooms, ...state.rooms.filter((r) => !r.open)];

  return (
    <>
      <div className={s.bar}>
        <div className={s.barMain}>
          <span className={s.barNo} aria-hidden="true">{state.table}</span>
          <div className={s.barText}>
            <span className={s.barTitle}>{state.table}번 테이블</span>
            <span className={s.barMeta}>
              {hhmm(state.since)}부터 · 폰 {state.phones}대
            </span>
          </div>
        </div>
        <button type="button" className={s.menuBtn} onClick={() => setMenu(true)}>
          나가기
        </button>
      </div>

      {(state.joins.length > 0 || state.asks.length > 0) && (
        <div className={s.slabs} aria-live="polite">
          {state.joins.map((j) => (
            <div key={j.id} className={`${s.slab} ${s.slabLav}`}>
              <span className={s.slabNo} aria-hidden="true">{state.table}</span>
              <div className={s.slabText}>
                <span className={s.slabTitle}>새 폰 한 대가 우리 테이블로 들어오려고 합니다</span>
                <span className={s.slabWhen}>{ago(j.at, now)} · 같이 온 일행이 맞으면 허락하세요</span>
              </div>
              <div className={s.slabActions}>
                <button type="button" className={s.slabYes} disabled={busy !== null} onClick={() => run(`j${j.id}`, "admit", { dev: j.id, ok: true })}>
                  허락
                </button>
                <button type="button" className={s.slabNo2} disabled={busy !== null} onClick={() => run(`j${j.id}`, "admit", { dev: j.id, ok: false })}>
                  거절
                </button>
              </div>
            </div>
          ))}
          {state.asks.map((a) => (
            <div key={a.id} id={`ask-${a.id}`} className={s.slab}>
              <span className={s.slabNo} aria-hidden="true">{a.from}</span>
              <div className={s.slabText}>
                <span className={s.slabTitle}>{a.from}번 테이블이 말을 걸었습니다</span>
                {a.note && <span className={s.slabNote}>“{a.note}”</span>}
                <span className={s.slabWhen}>{ago(a.at, now)}</span>
              </div>
              <div className={s.slabActions}>
                <button type="button" className={s.slabYes} disabled={busy !== null} onClick={() => run(`a${a.id}`, "answer", { ask: a.id, ok: true })}>
                  {busy === `a${a.id}` ? "여는 중…" : "수락"}
                </button>
                <button type="button" className={s.slabNo2} disabled={busy !== null} onClick={() => run(`a${a.id}`, "answer", { ask: a.id, ok: false })}>
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {shownRooms.length > 0 && (
        <>
          <div className={s.head}>
            <h2 className={s.headTitle}>대화</h2>
            <span className={s.headHint}>{openRooms.length ? `${openRooms.length}곳과 대화 중` : "끝난 대화"}</span>
          </div>
          <div className={s.rooms}>
            {shownRooms.map((r) => {
              const last = lastOf(r.id);
              const n = unread(r.id);
              const preview = !last ? "" : last.sys ? sysText(last, state.table) : `${last.mine ? "우리: " : ""}${last.body}`;
              return (
                <button key={r.id} type="button" className={s.roomRow} data-open={r.open ? "1" : "0"} onClick={() => onOpen(r.id)}>
                  <span className={s.roomNo} aria-hidden="true">{r.with}</span>
                  <span className={s.roomText}>
                    <span className={s.roomName}>
                      {r.with}번 테이블{r.open ? "" : " · 끝남"}
                    </span>
                    <span className={s.roomLast}>{preview}</span>
                  </span>
                  <span className={s.roomSide}>
                    {last && <span className={s.roomTime}>{hhmm(last.at)}</span>}
                    {n > 0 && <span className={s.unread} aria-label={`안 읽은 글 ${n}개`}>{n > 99 ? "99+" : n}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className={s.head}>
        <h2 className={s.headTitle}>테이블</h2>
        <span className={s.headHint}>불 들어온 번호를 누르면 말을 겁니다</span>
      </div>
      <div className={s.grid}>
        {state.tiles.map((t) => (
          <button
            key={t.no}
            type="button"
            className={s.tile}
            data-s={t.state}
            aria-label={`${t.no}번 테이블${t.state === "me" ? " (우리)" : t.state === "on" ? ", 말 걸기" : t.state === "talk" ? ", 대화 중" : t.state === "got" ? ", 신청 옴" : t.state === "sent" ? ", 신청함" : ""}`}
            aria-disabled={t.state === "me" || undefined}
            onClick={() => t.state !== "me" && onTile(t)}
          >
            {t.no}
            {TILE_TAG[t.state] && <small>{TILE_TAG[t.state]}</small>}
            {t.state === "talk" && t.room && unread(t.room) > 0 && <span className={s.tileDot} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className={s.legend} aria-hidden="true">
        <span><i />말 걸 수 있음</span>
        <span><i data-k="got" />신청 옴</span>
        <span><i data-k="talk" />대화 중</span>
        <span><i data-k="empty" />아직 안 켬</span>
      </div>
      {!anyoneElse && <p className={s.alone}>아직 테이블톡을 켠 다른 테이블이 없습니다. 다른 테이블이 QR 을 찍으면 그 번호에 불이 들어옵니다.</p>}
      <div className={s.lobbyEnd}>
        <p className={s.fine}>불쾌한 대화는 대화방에서 차단·신고할 수 있습니다. 신고하면 직원이 봅니다.</p>
      </div>

      {askTo !== null && (
        <Sheet label={`${askTo}번 테이블에 말 걸기`} onClose={() => setAskTo(null)}>
          <p className={s.sheetKicker}>TALK TO</p>
          <p className={s.sheetTitle}>{askTo}번 테이블에 말 걸기</p>
          <input
            className={s.field}
            type="text"
            maxLength={NOTE_MAX}
            placeholder="첫 마디 (안 써도 됩니다)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            enterKeyHint="send"
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (await run("ask", "ask", { to: askTo, note })) setAskTo(null);
              }
            }}
          />
          <button type="button" className="btn btn-primary btn-lg btn-block" disabled={busy !== null || closed} onClick={async () => (await run("ask", "ask", { to: askTo, note })) && setAskTo(null)}>
            {busy === "ask" ? "보내는 중…" : "말 걸기"}
          </button>
          <p className={s.fine}>{askTo}번 테이블이 수락하면 두 테이블의 대화방이 열립니다. 10분 동안 답이 없으면 신청은 사라집니다.</p>
        </Sheet>
      )}

      {sentFor && (
        <Sheet label={`${sentFor.no}번 테이블에 보낸 신청`} onClose={() => setSentFor(null)}>
          <p className={s.sheetKicker}>WAITING</p>
          <p className={s.sheetTitle}>{sentFor.no}번 테이블의 답을 기다리는 중</p>
          <p className={s.sheetText}>수락하면 대화방이 바로 열립니다.</p>
          <button
            type="button"
            className="btn btn-outline btn-block"
            disabled={busy !== null}
            onClick={async () => (await run("cancel", "cancel", { ask: sentFor.ask })) && setSentFor(null)}
          >
            신청 취소
          </button>
          <button type="button" className={s.plainBtn} onClick={() => setSentFor(null)}>
            닫기
          </button>
        </Sheet>
      )}

      {menu && (
        <Sheet label="나가기" onClose={() => (setMenu(false), setConfirmEnd(false))}>
          <p className={s.sheetKicker}>LEAVE</p>
          <p className={s.sheetTitle}>{state.table}번 테이블</p>
          {confirmEnd ? (
            <>
              <p className={s.sheetText}>우리 테이블 폰 {state.phones}대가 모두 나가고, 열린 대화방도 모두 닫힙니다. 상대 테이블에는 “자리를 떠났습니다”로 보입니다.</p>
              <button type="button" className="btn btn-outline btn-block" disabled={busy !== null} onClick={() => run("end", "end", {})}>
                {busy === "end" ? "닫는 중…" : "자리 떠나기"}
              </button>
              <button type="button" className={s.plainBtn} onClick={() => setConfirmEnd(false)}>
                취소
              </button>
            </>
          ) : (
            <div className={s.menuList}>
              <button type="button" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => setConfirmEnd(true)}>
                <b>자리 떠나기</b>
                <span>계산하고 나갈 때. 우리 테이블 대화를 모두 닫습니다</span>
              </button>
              <button type="button" className={s.menuItem} disabled={busy !== null} onClick={() => run("phone", "leave-phone", {})}>
                <b>이 폰만 나가기</b>
                <span>일행은 계속 대화합니다{state.phones <= 1 ? " (지금은 이 폰뿐이라 자리도 닫힙니다)" : ""}</span>
              </button>
              <button type="button" className={s.menuItem} onClick={() => setMenu(false)}>
                <b>닫기</b>
              </button>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
