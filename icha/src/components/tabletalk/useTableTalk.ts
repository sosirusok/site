"use client";
/**
 * 테이블톡 화면의 엔진 — 서버에 몇 초마다 묻고(폴링), 누른 것을 보내고, 받은 것을 합친다.
 *
 *  - 화면이 꺼져 있으면(다른 앱·잠금) 묻지 않는다. 다시 보면 바로 묻는다.
 *  - 대화방을 보고 있으면 2.5초, 번호판이면 4초. 조용하면 점점 늦춘다. 서버가 주는 pace 만큼 더 늦춘다(무료 요금제 보호).
 *  - 서버의 변경 번호(v)가 그대로면 서버는 한 줄만 돌려준다. 1분에 한 번은 전부 다시 받는다(시간이 지나 바뀌는 칸 때문).
 *  - 보내기는 화면에 먼저 그려 두고(보내는 중), 서버가 같은 표식(nonce)의 글을 돌려주면 진짜로 바꾼다.
 *    끊겨서 실패하면 [다시]를 눌러 같은 표식으로 다시 보낸다 — 서버가 두 번 넣지 않는다.
 *  - 누른 것(op)의 응답이 언제나 이긴다. 그 전에 떠난 물음의 응답이 늦게 오면 버린다(누르기 전 모습으로 되돌아가지 않게).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { pollDelay } from "@/lib/tabletalk/pace";
import type { StoreId } from "@/lib/config";
import type { Msg, OutWhy, Sync, TTState } from "@/lib/tabletalk/types";

export type Pending = { nonce: string; room: string; body: string; at: string; failed?: boolean };

export type Phase =
  | { kind: "idle" }
  | { kind: "app"; state: TTState }
  | { kind: "waiting"; store: StoreId; storeName: string; table: number }
  | { kind: "out"; why: OutWhy };

type OpResult = { ok: boolean; code?: string; error?: string };

const maxId = (ms: Msg[]) => ms.reduce((m, x) => (x.id > m ? x.id : m), 0);

function merge(prev: Msg[], incoming: Msg[]): Msg[] {
  if (incoming.length === 0) return prev;
  const map = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort((a, b) => a.id - b.id);
}

function nonce(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  } catch {
    return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
}

function buzz(): void {
  try {
    navigator.vibrate?.(35);
  } catch {
    /* 진동 없는 기기 */
  }
}

/** 읽은 곳은 이 폰에 남긴다 — QR 을 다시 찍으면 새 탭으로 열리는 일이 많아 탭마다 기억하면 옛 글이 모두 안 읽음이 된다 */
const READ_PREFIX = "tt-read:";
function readStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
/** 이틀 지난 자리의 읽은 곳은 지운다(키 끝이 자리 시작 시각) */
function pruneRead(): void {
  const ls = readStore();
  if (!ls) return;
  try {
    const old: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (!k?.startsWith(READ_PREFIX)) continue;
      // tt-read:가게:테이블:2026-10-01T13:00:00.000Z — 시각에도 ':' 가 있어 넷째 칸부터 다시 붙인다
      const since = Date.parse(k.split(":").slice(3).join(":"));
      if (!Number.isFinite(since) || Date.now() - since > 2 * 86400_000) old.push(k);
    }
    for (const k of old) ls.removeItem(k);
  } catch {
    /* 못 지워도 그만 */
  }
}

function phaseOf(s: Sync): Phase {
  if (s.kind === "state") return { kind: "app", state: s.state };
  if (s.kind === "waiting") return { kind: "waiting", store: s.store, storeName: s.storeName, table: s.table };
  if (s.kind === "out") return { kind: "out", why: s.why };
  return { kind: "idle" };
}

export function useTableTalk(initial: Sync | null) {
  const [phase, setPhase] = useState<Phase>(() => (initial ? phaseOf(initial) : { kind: "idle" }));
  const [msgs, setMsgs] = useState<Msg[]>(() => (initial?.kind === "state" ? initial.state.msgs : []));
  const [pending, setPending] = useState<Pending[]>([]);
  const [closed, setClosed] = useState(initial?.kind === "state" || initial?.kind === "same" ? initial.closed : false);
  const [offline, setOffline] = useState(false);
  const [toast, setToast] = useState<{ text: string; at: number } | null>(null);
  const [openRoom, setOpenRoomState] = useState<string | null>(null);
  const [readUpTo, setReadUpTo] = useState<Record<string, number>>({});

  const vRef = useRef(initial?.kind === "state" ? initial.state.v : -1);
  const cursorRef = useRef(initial?.kind === "state" ? maxId(initial.state.msgs) : 0);
  const seatRef = useRef(initial?.kind === "state" ? `${initial.state.store}:${initial.state.table}:${initial.state.since}` : "");
  const paceRef = useRef(initial?.kind === "state" || initial?.kind === "same" || initial?.kind === "waiting" ? initial.pace : 1);
  const phaseRef = useRef<Phase["kind"]>(phase.kind);
  const openRoomRef = useRef<string | null>(null);
  const knownRef = useRef<Set<string>>(new Set(initial?.kind === "state" ? [...initial.state.asks.map((a) => a.id), ...initial.state.joins.map((j) => j.id)] : []));
  const timer = useRef<number | undefined>(undefined);
  const inflight = useRef(false);
  const lastChange = useRef(Date.now());
  const lastFull = useRef(Date.now());
  const fails = useRef(0);
  const tickRef = useRef<() => Promise<void>>(async () => {});
  /** 누른 것이 시작·끝날 때마다 오른다 — 그사이 떠났던 물음의 응답은 버린다 */
  const epoch = useRef(0);
  /** 화면을 떠났으면(다른 페이지로) 더 묻지 않는다 */
  const alive = useRef(true);

  const showToast = useCallback((text: string) => setToast({ text, at: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast((cur) => (cur && cur.at === toast.at ? null : cur)), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // 읽은 곳 — 이 자리(테이블·시작 시각)마다 이 폰에 기억
  const readKey = phase.kind === "app" ? `${READ_PREFIX}${phase.state.store}:${phase.state.table}:${phase.state.since}` : "";
  useEffect(() => {
    if (!readKey) return;
    pruneRead();
    try {
      const raw = readStore()?.getItem(readKey);
      setReadUpTo(raw ? (JSON.parse(raw) as Record<string, number>) : {});
    } catch {
      setReadUpTo({});
    }
  }, [readKey]);
  const markRead = useCallback(
    (room: string, upTo: number) => {
      setReadUpTo((prev) => {
        if ((prev[room] ?? 0) >= upTo) return prev;
        const next = { ...prev, [room]: upTo };
        try {
          if (readKey) readStore()?.setItem(readKey, JSON.stringify(next));
        } catch {
          /* 저장 못 해도 화면은 돈다 */
        }
        return next;
      });
    },
    [readKey],
  );

  /** 서버 응답 반영. 무엇이 바뀌었으면 true */
  const apply = useCallback((s: Sync): boolean => {
    if (s.kind === "same") {
      paceRef.current = s.pace;
      setClosed(s.closed);
      return false;
    }
    if (s.kind === "waiting" || s.kind === "out") {
      // 다음에 들어가는 자리는 처음부터 받는다 — 전 테이블의 글 번호로 이어 받으면 새 테이블의 앞 글을 건너뛴다
      vRef.current = -1;
      cursorRef.current = 0;
      seatRef.current = "";
    }
    if (s.kind === "waiting") {
      paceRef.current = s.pace;
      phaseRef.current = "waiting";
      setPhase({ kind: "waiting", store: s.store, storeName: s.storeName, table: s.table });
      return false;
    }
    if (s.kind === "out") {
      phaseRef.current = "out";
      setPhase({ kind: "out", why: s.why });
      return true;
    }
    const st = s.state;
    paceRef.current = s.pace;
    setClosed(s.closed);
    const seat = `${st.store}:${st.table}:${st.since}`;
    const newSeat = seat !== seatRef.current;
    seatRef.current = seat;
    const changed = newSeat || st.v !== vRef.current || st.msgs.length > 0;
    vRef.current = st.v;

    // 새로 온 글(상대가 보낸 것)·새 신청·새 폰 — 짧게 진동
    const fresh = st.msgs.filter((m) => m.id > cursorRef.current && !m.mine && !m.sys);
    const freshIds = [...st.asks.map((a) => a.id), ...st.joins.map((j) => j.id)].filter((id) => !knownRef.current.has(id));
    if (!newSeat && (freshIds.length > 0 || fresh.some((m) => m.room !== openRoomRef.current || document.hidden))) buzz();
    for (const id of freshIds) knownRef.current.add(id);

    if (newSeat) {
      setMsgs(st.msgs);
      cursorRef.current = maxId(st.msgs);
      setPending([]);
    } else if (st.msgs.length) {
      setMsgs((prev) => merge(prev, st.msgs));
      cursorRef.current = Math.max(cursorRef.current, maxId(st.msgs));
      const got = new Set(st.msgs.map((m) => m.nonce).filter(Boolean));
      if (got.size) setPending((p) => p.filter((x) => !got.has(x.nonce)));
    }
    // 방이 사라졌으면(자리가 바뀜) 닫는다
    if (openRoomRef.current && !st.rooms.some((r) => r.id === openRoomRef.current)) {
      openRoomRef.current = null;
      setOpenRoomState(null);
    }
    phaseRef.current = "app";
    setPhase({ kind: "app", state: st });
    return changed;
  }, []);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    const ph = phaseRef.current;
    if (!alive.current || ph === "idle" || ph === "out") return;
    const delay = fails.current
      ? Math.min(20_000, 1500 * 2 ** fails.current)
      : ph === "waiting"
        ? Math.round(3000 * Math.max(1, paceRef.current))
        : pollDelay({ inRoom: !!openRoomRef.current, quietMs: Date.now() - lastChange.current, pace: paceRef.current });
    timer.current = window.setTimeout(() => void tickRef.current(), delay);
  }, []);

  const tick = async () => {
    window.clearTimeout(timer.current);
    const ph = phaseRef.current;
    if (!alive.current || ph === "idle" || ph === "out" || document.visibilityState === "hidden") return;
    if (inflight.current) {
      timer.current = window.setTimeout(() => void tickRef.current(), 400);
      return;
    }
    inflight.current = true;
    let ok = false;
    const e0 = epoch.current;
    try {
      const full = Date.now() - lastFull.current > 60_000;
      const res = await fetch(`/api/tt?v=${full ? -1 : vRef.current}&after=${cursorRef.current}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; sync?: Sync } | null;
      if (data?.ok && data.sync) {
        ok = true;
        // 묻는 사이에 누른 것이 있었으면 그 응답이 더 새것이다 — 이 응답은 버린다
        if (alive.current && epoch.current === e0) {
          if (full) lastFull.current = Date.now();
          if (apply(data.sync)) lastChange.current = Date.now();
        }
      }
    } catch {
      /* 아래에서 다시 */
    }
    inflight.current = false;
    if (!alive.current) return;
    fails.current = ok ? 0 : fails.current + 1;
    setOffline(fails.current >= 2);
    schedule();
  };
  // 타이머가 부르는 함수는 언제나 마지막으로 그린 화면의 것을 쓴다
  useEffect(() => {
    tickRef.current = tick;
  });

  // 화면을 다시 보면 바로 묻는다. 안 보면 멈춘다. 이 화면을 떠나면 아주 멈춘다
  useEffect(() => {
    alive.current = true;
    const onVis = () => {
      if (document.visibilityState === "visible") void tickRef.current();
      else window.clearTimeout(timer.current);
    };
    const onOnline = () => void tickRef.current();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pageshow", onOnline);
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  // 들어왔거나 기다리는 중이면 묻기 시작
  useEffect(() => {
    phaseRef.current = phase.kind;
    if (phase.kind === "app" || phase.kind === "waiting") schedule();
    else window.clearTimeout(timer.current);
  }, [phase.kind, schedule]);

  const op = useCallback(
    async (name: string, payload: Record<string, unknown> = {}): Promise<OpResult> => {
      epoch.current++;
      try {
        const res = await fetch("/api/tt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ op: name, after: cursorRef.current, ...payload }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; sync?: Sync; error?: string; code?: string } | null;
        epoch.current++;
        if (!alive.current) return { ok: !!data?.ok, code: data?.code, error: data?.error };
        if (!data?.ok) {
          const error = data?.error ?? "연결이 고르지 않습니다. 다시 눌러 주세요.";
          if (name !== "join") showToast(error);
          if (data?.code === "out" || data?.code === "waiting") void tickRef.current();
          return { ok: false, code: data?.code, error };
        }
        if (data.sync) apply(data.sync);
        lastChange.current = Date.now();
        lastFull.current = Date.now();
        fails.current = 0;
        setOffline(false);
        schedule();
        return { ok: true };
      } catch {
        epoch.current++;
        const error = "연결이 고르지 않습니다. 다시 눌러 주세요.";
        if (name !== "join" && alive.current) showToast(error);
        return { ok: false, code: "net", error };
      }
    },
    [apply, schedule, showToast],
  );

  const sendText = useCallback(
    async (room: string, body: string, again?: string) => {
      const n = again ?? nonce();
      if (again) setPending((p) => p.map((x) => (x.nonce === n ? { ...x, failed: false } : x)));
      else setPending((p) => [...p, { nonce: n, room, body, at: new Date().toISOString() }]);
      const r = await op("send", { room, body, nonce: n });
      if (!r.ok) setPending((p) => p.map((x) => (x.nonce === n ? { ...x, failed: true } : x)));
      return r.ok;
    },
    [op],
  );

  const dropPending = useCallback((n: string) => setPending((p) => p.filter((x) => x.nonce !== n)), []);

  const setOpenRoom = useCallback(
    (id: string | null) => {
      openRoomRef.current = id;
      setOpenRoomState(id);
      lastChange.current = Date.now();
      schedule();
    },
    [schedule],
  );

  return { phase, msgs, pending, closed, offline, toast, openRoom, readUpTo, op, sendText, dropPending, setOpenRoom, markRead, showToast };
}
