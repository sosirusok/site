"use client";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MSG_MAX } from "@/lib/tabletalk/text";
import type { Msg, Room as RoomT } from "@/lib/tabletalk/types";
import { Sheet } from "./Sheet";
import type { Pending } from "./useTableTalk";
import { hhmm, sysText } from "./words";
import s from "./tt.module.css";

type Op = (name: string, payload?: Record<string, unknown>) => Promise<{ ok: boolean; code?: string }>;

const nearBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 140;
const toBottom = (smooth = false) => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth ? "smooth" : "auto" });

const END_TEXT: Record<string, string> = {
  left: "대화가 끝났습니다.",
  gone: "상대 테이블이 자리를 떠나 대화가 끝났습니다.",
  end: "대화가 끝났습니다.",
  staff: "직원이 대화를 닫았습니다.",
};

/**
 * 대화방 — 두 테이블의 단체 대화. 오른쪽(라임) = 우리 테이블 폰 누구든, 왼쪽 = 상대 테이블.
 * 보내기는 Enter(한글 조합 중에는 보내지 않는다) 또는 [보내기].
 */
export function RoomView({
  room, myTable, msgs, pending, closed, op, onSend, onDrop, onBack, onRead,
}: {
  room: RoomT;
  myTable: number;
  msgs: Msg[];
  pending: Pending[];
  closed: boolean;
  op: Op;
  onSend: (room: string, body: string, again?: string) => Promise<boolean>;
  onDrop: (nonce: string) => void;
  onBack: () => void;
  onRead: (room: string, upTo: number) => void;
}) {
  const [text, setText] = useState("");
  const [menu, setMenu] = useState<null | "menu" | "leave" | "block" | "report">(null);
  const [busy, setBusy] = useState(false);
  const [below, setBelow] = useState(0);
  const ta = useRef<HTMLTextAreaElement>(null);
  const seen = useRef(0);
  const lastId = msgs.length ? msgs[msgs.length - 1]!.id : 0;

  // 처음 열면 맨 아래로
  useLayoutEffect(() => {
    toBottom();
    seen.current = lastId;
  }, [room.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 새 글: 아래를 보고 있었으면 따라 내려가고, 위를 읽고 있었으면 [새 글] 단추만
  useEffect(() => {
    if (lastId <= seen.current) return;
    const fresh = msgs.filter((m) => m.id > seen.current && !m.mine).length;
    seen.current = lastId;
    if (nearBottom() || fresh === 0) toBottom(true);
    else setBelow((n) => n + fresh);
  }, [lastId, msgs]);

  // 아이폰은 자판이 올라와도 화면 높이가 그대로라 아래 입력칸이 자판에 가린다 — 가린 만큼 입력칸을 올린다(--kb)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--kb", `${Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))}px`);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--kb");
    };
  }, []);

  useEffect(() => {
    const onScroll = () => nearBottom() && setBelow(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 보고 있는 동안 읽음 처리
  useEffect(() => {
    if (document.visibilityState === "visible") onRead(room.id, Math.max(room.last, lastId));
  }, [room.id, room.last, lastId, onRead]);

  // 내가 보낸 글이 생기면 맨 아래로
  useEffect(() => {
    if (pending.length) toBottom(true);
  }, [pending.length]);

  function grow() {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  async function submit() {
    const body = text.trim();
    if (!body || closed || Array.from(body).length > MSG_MAX) return;
    setText("");
    requestAnimationFrame(grow);
    ta.current?.focus();
    await onSend(room.id, body);
  }

  async function close(how: "leave" | "block" | "report") {
    setBusy(true);
    const r = await op(how, { room: room.id });
    setBusy(false);
    if (r.ok) setMenu(null);
  }

  const items: { key: string; node: React.ReactNode }[] = [];
  let prevSide: "mine" | "theirs" | "sys" | null = null;
  msgs.forEach((m, i) => {
    if (m.sys) {
      items.push({ key: `m${m.id}`, node: <p className={s.sys}>{sysText(m, myTable)} · {hhmm(m.at)}</p> });
      prevSide = "sys";
      return;
    }
    const side = m.mine ? "mine" : "theirs";
    const next = msgs[i + 1];
    const lastOfRun = !next || !!next.sys || next.mine !== m.mine || hhmm(next.at) !== hhmm(m.at);
    items.push({
      key: `m${m.id}`,
      node: (
        <div className={`${s.msg} ${s[side]}`}>
          {side === "theirs" && prevSide !== "theirs" && <span className={s.who}>{room.with}번</span>}
          <p className={s.bubble}>{m.body}</p>
          {lastOfRun && <span className={s.time}>{hhmm(m.at)}</span>}
        </div>
      ),
    });
    prevSide = side;
  });
  for (const p of pending) {
    items.push({
      key: `p${p.nonce}`,
      node: (
        <div className={`${s.msg} ${s.mine} ${p.failed ? s.failed : s.sending}`}>
          <p className={s.bubble}>{p.body}</p>
          {p.failed ? (
            <span className={s.retry}>
              안 보내졌습니다
              <button type="button" onClick={() => void onSend(room.id, p.body, p.nonce)}>
                다시
              </button>
              <button type="button" onClick={() => onDrop(p.nonce)}>
                지우기
              </button>
            </span>
          ) : (
            <span className={s.time}>보내는 중</span>
          )}
        </div>
      ),
    });
  }

  const count = Array.from(text).length;

  return (
    <div className={s.room}>
      <header className={s.roomTop} data-open={room.open ? "1" : "0"}>
        <button type="button" className={s.back} onClick={onBack} aria-label="대화 목록으로">
          ← 목록
        </button>
        <div className={s.roomHead}>
          <span className={s.roomHeadNo} aria-hidden="true">{room.with}</span>
          <span className={s.roomHeadText}>
            <span className={s.roomHeadName}>{room.with}번 테이블</span>
            <span className={s.roomHeadSub}>
              우리 {myTable}번 ↔ {room.with}번 · 두 테이블 모두 보는 방
            </span>
          </span>
        </div>
        <button type="button" className={s.menuBtn} onClick={() => setMenu("menu")}>
          메뉴
        </button>
      </header>

      <div className={s.list} role="log" aria-label={`${room.with}번 테이블과의 대화`}>
        {items.map((it) => (
          <Fragment key={it.key}>{it.node}</Fragment>
        ))}
        {below > 0 && (
          <button type="button" className={s.newBelow} onClick={() => (toBottom(true), setBelow(0))}>
            새 글 {below} ↓
          </button>
        )}
      </div>

      {room.open ? (
        <form
          className={s.composer}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <textarea
            ref={ta}
            className={s.input}
            rows={1}
            maxLength={MSG_MAX * 2}
            placeholder={closed ? "오늘은 새 글을 잠시 멈췄습니다" : `${room.with}번 테이블에게`}
            value={text}
            disabled={closed}
            enterKeyHint="send"
            onChange={(e) => {
              setText(e.target.value);
              grow();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button type="submit" className={s.sendBtn} disabled={closed || !text.trim() || count > MSG_MAX}>
            보내기
          </button>
          {count > MSG_MAX - 40 && (
            <span className={s.count} style={count > MSG_MAX ? { color: "var(--danger)" } : undefined}>
              {count}/{MSG_MAX}
            </span>
          )}
        </form>
      ) : (
        <div className={s.ended}>
          <p className={s.endedText}>{room.byUs ? "대화를 닫았습니다." : END_TEXT[room.reason ?? "left"]}</p>
          <button type="button" className="btn btn-outline btn-block" onClick={onBack}>
            목록으로
          </button>
        </div>
      )}

      {menu && (
        <Sheet label={`${room.with}번 테이블 대화 메뉴`} onClose={() => setMenu(null)}>
          <p className={s.sheetKicker}>TABLE {room.with}</p>
          {menu === "menu" && (
            <>
              <p className={s.sheetTitle}>{room.with}번 테이블과의 대화</p>
              <div className={s.menuList}>
                {room.open && (
                  <button type="button" className={s.menuItem} onClick={() => setMenu("leave")}>
                    <b>대화 나가기</b>
                    <span>방이 닫힙니다. 15분 뒤에 다시 말을 걸 수 있습니다</span>
                  </button>
                )}
                <button type="button" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => setMenu("block")}>
                  <b>차단</b>
                  <span>오늘 밤 이 테이블과는 서로 말을 걸 수 없습니다</span>
                </button>
                <button type="button" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => setMenu("report")}>
                  <b>신고</b>
                  <span>차단하고, 이 대화를 직원에게 보냅니다</span>
                </button>
                <button type="button" className={s.menuItem} onClick={() => setMenu(null)}>
                  <b>닫기</b>
                </button>
              </div>
            </>
          )}
          {menu !== "menu" && (
            <>
              <p className={s.sheetTitle}>
                {menu === "leave" ? "대화를 나갈까요?" : menu === "block" ? `${room.with}번 테이블을 차단할까요?` : `${room.with}번 테이블을 신고할까요?`}
              </p>
              <p className={s.sheetText}>
                {menu === "leave"
                  ? `${room.with}번 테이블에는 “${myTable}번 테이블이 대화를 나갔습니다”로 보입니다.`
                  : menu === "block"
                    ? "상대에게는 “대화가 끝났습니다”로만 보입니다. 누가 차단했는지는 알리지 않습니다."
                    : "상대에게는 “대화가 끝났습니다”로만 보입니다. 직원이 이 대화를 보고 필요하면 그 테이블을 내보냅니다."}
              </p>
              <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => void close(menu)}>
                {busy ? "처리 중…" : menu === "leave" ? "나가기" : menu === "block" ? "차단" : "신고"}
              </button>
              <button type="button" className={s.plainBtn} onClick={() => setMenu("menu")}>
                취소
              </button>
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}
