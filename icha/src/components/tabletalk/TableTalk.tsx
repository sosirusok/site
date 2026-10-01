"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { BRAND } from "@/lib/config";
import type { Entry, JoinMode } from "@/lib/tabletalk/types";
import { JoinScreen, NoticeScreen, WaitingScreen } from "./Entry";
import { Lobby } from "./Lobby";
import { RoomView } from "./Room";
import { useTableTalk } from "./useTableTalk";
import s from "./tt.module.css";

/**
 * 테이블톡 한 화면 — 입장 → (허락 대기) → 번호판 ↔ 대화방.
 * 대화방은 브라우저 뒤로 가기로도 닫힌다(대화방을 열 때 기록을 하나 쌓는다).
 */
export function TableTalk({ entry }: { entry: Entry }) {
  const tt = useTableTalk(entry.kind === "in" ? entry.sync : null);
  const { phase, msgs, pending, closed, offline, toast, openRoom, readUpTo, op, sendText, dropPending, setOpenRoom, markRead, showToast } = tt;
  const code = entry.kind === "join" || entry.kind === "in" ? entry.code : "";

  const state = phase.kind === "app" ? phase.state : null;
  const room = state && openRoom ? (state.rooms.find((r) => r.id === openRoom) ?? null) : null;

  const unread = useCallback(
    (roomId: string) => {
      const upTo = readUpTo[roomId] ?? 0;
      let n = 0;
      for (const m of msgs) if (m.room === roomId && !m.mine && !m.sys && m.id > upTo) n++;
      return n;
    },
    [msgs, readUpTo],
  );

  // 대화방 열기/닫기 ↔ 뒤로 가기
  const open = useCallback(
    (id: string) => {
      window.history.pushState({ ttRoom: id }, "");
      setOpenRoom(id);
    },
    [setOpenRoom],
  );
  const back = useCallback(() => {
    if ((window.history.state as { ttRoom?: string } | null)?.ttRoom) window.history.back();
    else setOpenRoom(null);
  }, [setOpenRoom]);
  useEffect(() => {
    // 대화방을 연 채로 새로고침하면 기록에 방 표시가 남는다 — 지금 칸(번호판)에서는 지운다. 안 지우면 뒤로 가기가 엉뚱한 방을 연다
    if ((window.history.state as { ttRoom?: string } | null)?.ttRoom) window.history.replaceState(null, "");
    const onPop = (e: PopStateEvent) => setOpenRoom((e.state as { ttRoom?: string } | null)?.ttRoom ?? null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setOpenRoom]);
  useEffect(() => {
    if (!openRoom) window.scrollTo(0, 0);
  }, [openRoom]);

  // 탭 제목에 안 읽은 글·받은 신청 수
  const badge = useMemo(() => {
    if (!state) return 0;
    return state.rooms.reduce((n, r) => n + unread(r.id), 0) + state.asks.length + state.joins.length;
  }, [state, unread]);
  useEffect(() => {
    document.title = `${badge > 0 ? `(${badge}) ` : ""}테이블톡 — ${BRAND.name}`;
  }, [badge]);

  const join = (mode: JoinMode) => op("join", { code, mode });

  const storeId = state?.store ?? (entry.kind === "join" ? entry.store : phase.kind === "waiting" ? phase.store : undefined);
  const storeName = state?.storeName ?? (entry.kind === "join" || entry.kind === "off" || entry.kind === "locked" ? entry.storeName : phase.kind === "waiting" ? phase.storeName : "");
  const table = state?.table ?? (entry.kind === "join" || entry.kind === "locked" ? entry.table : phase.kind === "waiting" ? phase.table : null);

  let body: React.ReactNode;
  if (phase.kind === "app" && state) {
    body = room ? (
      <RoomView
        room={room}
        myTable={state.table}
        msgs={msgs.filter((m) => m.room === room.id)}
        pending={pending.filter((p) => p.room === room.id)}
        closed={closed}
        op={op}
        onSend={sendText}
        onDrop={dropPending}
        onBack={back}
        onRead={markRead}
      />
    ) : (
      <Lobby state={state} msgs={msgs} unread={unread} closed={closed} op={op} onOpen={open} onToast={showToast} />
    );
  } else if (phase.kind === "waiting") {
    body = (
      <WaitingScreen
        storeName={phase.storeName}
        table={phase.table}
        onCancel={() => void op("leave-phone")}
        onFresh={async () => {
          await op("join", { code, mode: "fresh" }).then((r) => !r.ok && r.error && showToast(r.error));
        }}
      />
    );
  } else if (phase.kind === "out") {
    body = <NoticeScreen kicker={storeName} title={phase.why === "self" || phase.why === "team" ? "테이블톡에서 나왔습니다" : "대화가 닫혔습니다"} why={phase.why} again={!!code} />;
  } else if (entry.kind === "join") {
    body = <JoinScreen entry={entry} onJoin={join} />;
  } else if (entry.kind === "off") {
    body = <NoticeScreen kicker={entry.storeName} title="지금은 테이블톡을 쓰지 않습니다" text="이 가게는 테이블톡을 꺼 두었습니다." />;
  } else if (entry.kind === "locked") {
    body = <NoticeScreen kicker={entry.storeName} title={`${entry.table}번 테이블은 오늘 테이블톡을 쓸 수 없습니다`} text="직원에게 말씀해 주세요." />;
  } else {
    body = <NoticeScreen title="QR 이 맞지 않습니다" text="테이블에 붙은 QR 을 다시 찍어 주세요. 사진으로 받은 QR 은 열리지 않을 수 있습니다." />;
  }

  return (
    <div className={`app ${s.shell}`} data-store={storeId}>
      {!room && (
        <header className={s.top}>
          <Link href="/" className={s.brand} aria-label={`${BRAND.name} 홈`}>
            <span className={s.mark}>{BRAND.name}</span>
            <span className={s.markEn} aria-hidden="true">TABLE TALK</span>
          </Link>
          {table != null && (
            <span className={s.where}>
              {storeName}
              <span className={s.whereNo}>{table}</span>
            </span>
          )}
        </header>
      )}
      {offline && <p className={s.band} role="status">연결이 고르지 않습니다. 다시 연결하는 중…</p>}
      {closed && phase.kind === "app" && <p className={s.band}>오늘은 테이블톡 이용이 많아 새 글을 잠시 멈췄습니다. 보던 대화는 그대로 보입니다.</p>}
      <main>{body}</main>
      {toast && (
        <p className={s.toast} role="status" key={toast.at}>
          {toast.text}
        </p>
      )}
    </div>
  );
}
