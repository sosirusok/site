"use client";
/**
 * 테이블톡 화면의 엔진 — 서버에 몇 초마다 묻고(폴링), 누른 것을 보내고, 받은 것을 합친다.
 *
 *  - 화면이 꺼져 있으면(다른 앱·잠금) 묻지 않는다. 다시 보면 바로 묻는다.
 *  - 대화방을 보고 있으면 2.5초, 번호판이면 4초. 조용하면 점점 늦춘다. 서버가 주는 pace 만큼 더 늦춘다(무료 요금제 보호).
 *  - 서버의 변경 번호(v)가 그대로면 서버는 한 줄만 돌려준다. 1분에 한 번은 전부 다시 받는다(시간이 지나 바뀌는 칸 때문).
 *  - 보내기는 화면에 먼저 그려 두고(보내는 중), 서버가 같은 표식(nonce)의 글을 돌려주면 진짜로 바꾼다.
 *    끊겨서 실패하면 [다시]를 눌러 같은 표식으로 다시 보낸다 — 서버가 두 번 넣지 않는다.
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

  const showToast = useCallback((text: string) => setToast({ text, at: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast((cur) => (cur && cur.at === toast.at ? null : cur)), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // 읽은 곳 — 이 자리(테이블·시작 시각)마다 이 탭에서만 기억
  const readKey = phase.kind === "app" ? `tt-read:${phase.state.store}:${phase.state.table}:${phase.state.since}` : "";
  useEffect(() => {
    if (!readKey) return;
    try {
      const raw = sessionStorage.getItem(readKey);
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
          if (readKey) sessionStorage.setItem(readKey, JSON.stringify(next));
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
    if (ph === "idle" || ph === "out") return;
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
    if (ph === "idle" || ph === "out" || document.visibilityState === "hidden") return;
    if (inflight.current) {
      timer.current = window.setTimeout(() => void tickRef.current(), 400);
      return;
    }
    inflight.current = true;
    let ok = false;
    try {
      const full = Date.now() - lastFull.current > 60_000;
      const res = await fetch(`/api/tt?v=${full ? -1 : vRef.current}&after=${cursorRef.current}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; sync?: Sync } | null;
      if (data?.ok && data.sync) {
        if (full) lastFull.current = Date.now();
        if (apply(data.sync)) lastChange.current = Date.now();
        ok = true;
      }
    } catch {
      /* 아래에서 다시 */
    }
    inflight.current = false;
    fails.current = ok ? 0 : fails.current + 1;
    setOffline(fails.current >= 2);
    schedule();
  };
  // 타이머가 부르는 함수는 언제나 마지막으로 그린 화면의 것을 쓴다
  useEffect(() => {
    tickRef.current = tick;
  });

  // 화면을 다시 보면 바로 묻는다. 안 보면 멈춘다
  useEffect(() => {
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
      try {
        const res = await fetch("/api/tt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ op: name, after: cursorRef.current, ...payload }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; sync?: Sync; error?: string; code?: string } | null;
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
        const error = "연결이 고르지 않습니다. 다시 눌러 주세요.";
        if (name !== "join") showToast(error);
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
