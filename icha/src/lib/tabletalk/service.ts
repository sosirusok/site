/**
 * 테이블톡 — 서버 쪽 전부. 화면(API)은 여기 함수만 부른다.
 *
 * 흐름
 *  1) 테이블 QR → 그 테이블에 열린 자리가 없으면 새 자리, 있으면 일행으로 들어간다.
 *     자리가 열리고 5분 안에 찍은 폰은 바로 들어온다(같이 온 일행). 그 뒤에 오는 폰은 이미 들어온 폰이 [허락]해야 들어온다 —
 *     지나가다 남의 테이블 QR 을 찍은 사람이 그 테이블 행세를 하거나 대화를 엿보지 못하게.
 *  2) 번호판에서 다른 테이블을 눌러 말을 건다 → 상대 테이블 폰 중 하나가 [수락]하면 두 테이블의 단체 대화방이 열린다.
 *  3) 대화방은 어느 쪽이든 나가기·차단·신고로 닫는다. 닫힌 뒤 15분은 같은 테이블에 다시 말을 걸 수 없다.
 *  4) 자리는 일행이 [자리 떠나기]를 누르거나, 직원이 비우거나, 3시간 아무 폰도 안 보거나, 영업일이 바뀌면 끝난다.
 *
 * 화면은 몇 초마다 sync() 로 묻는다. 매장마다 변경 번호(tt_state.v)가 있어, 바뀐 게 없으면 한 줄 읽고 끝낸다.
 * 모든 쓰기는 끝에 bump() 로 그 번호를 올린다.
 */
import { tx, query, one, type Queryable } from "@/lib/db";
import type { StoreId } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";
import { getStore } from "@/lib/stores";
import { serviceDay, type TableRef } from "./code";
import { getTTSettings } from "./settings";
import { cleanMessage, cleanNote } from "./text";
import type { AskIn, AskOut, CloseReason, JoinMode, JoinWait, Msg, OutWhy, Room, SysKind, Tile, TTState } from "./types";

export type { JoinMode } from "./types";

export class TTError extends Error {
  constructor(message: string, public status = 400, public code: string = "bad") {
    super(message);
  }
}

/** 자리가 열리고 이 시간 안에 찍은 폰은 허락 없이 들어온다(같이 온 일행). TT_FRESH_JOIN_MS 로 바꿀 수 있다 */
export const FRESH_JOIN_MS = Number(process.env.TT_FRESH_JOIN_MS) > 0 ? Number(process.env.TT_FRESH_JOIN_MS) : 5 * 60_000;
/** [새로 앉았습니다] — 이 시간 넘게 그 자리 폰이 아무도 안 봤을 때만 이전 자리를 닫을 수 있다 */
export const QUIET_FOR_NEW_MS = 10 * 60_000;
const IDLE_END = "3 hours";
const ASK_TTL = "10 minutes";
const JOIN_TTL = "5 minutes";
const COOLDOWN = "15 minutes";
const ROOM_SHOW = "60 minutes";
export const MAX_OPEN_ROOMS = 6;
export const MAX_SENT = 3;

type SeatRow = { id: string; table_no: number; started_at: unknown; seen_at: unknown };

const asDate = (v: unknown): Date => (v instanceof Date ? v : new Date(String(v)));
const iso = (v: unknown): string => asDate(v).toISOString();

/* ───────── 변경 번호 · 정리 ───────── */

async function bump(q: Queryable, store: StoreId): Promise<void> {
  await q.query(`insert into tt_state (store_id, v) values ($1, 1) on conflict (store_id) do update set v = tt_state.v + 1`, [store]);
}

export async function version(store: StoreId): Promise<number> {
  const r = await one<{ v: string | number }>(`select v from tt_state where store_id=$1`, [store]);
  return Number(r?.v ?? 0);
}

/** 변경 번호 + 정리할 때가 됐는지(DB 시계 기준 1분) — 한 줄로 */
async function stateOf(store: StoreId): Promise<{ v: number; due: boolean }> {
  const r = await one<{ v: string | number; due: boolean }>(
    `select v, (swept_at is null or swept_at < now() - interval '60 seconds') as due from tt_state where store_id=$1`,
    [store],
  );
  return { v: Number(r?.v ?? 0), due: r ? Boolean(r.due) : true };
}

/**
 * 자리 끝내기 — 폰들을 내보내고, 기다리던 신청을 거두고, 열린 대화방을 닫으며 상대 방에 "N번 테이블이 자리를 떠났습니다"를 남긴다.
 * @returns 실제로 끝낸 자리 수
 */
async function endSeats(q: Queryable, seatIds: string[], why: Exclude<OutWhy, "none" | "denied" | "expired" | "locked" | "off">): Promise<number> {
  if (seatIds.length === 0) return 0;
  const ended = await q.query<{ id: string; table_no: number }>(
    `update tt_seats set status='off', ended_at=now(), ended_by=$2 where id = any($1::uuid[]) and status='on' returning id, table_no`,
    [seatIds, why],
  );
  if (ended.length === 0) return 0;
  const ids = ended.map((r) => r.id);
  await q.query(`update tt_devs set status = case when status='wait' then 'no' else 'out' end, out_reason=$2, decided_at=now() where seat_id = any($1::uuid[]) and status in ('in','wait')`, [ids, why]);
  await q.query(`update tt_asks set status='gone', decided_at=now() where status='wait' and (from_seat = any($1::uuid[]) or to_seat = any($1::uuid[]))`, [ids]);
  const rooms = await q.query<{ id: string; seat_a: string; seat_b: string }>(
    `update tt_rooms set status='closed', closed_at=now(), close_reason='gone',
       closed_by = case when seat_a = any($1::uuid[]) then seat_a else seat_b end
     where status='open' and (seat_a = any($1::uuid[]) or seat_b = any($1::uuid[])) returning id, seat_a, seat_b`,
    [ids],
  );
  const tableOf = new Map(ended.map((r) => [r.id, Number(r.table_no)]));
  for (const r of rooms) {
    const leaving = tableOf.has(r.seat_a) ? r.seat_a : r.seat_b;
    await q.query(`insert into tt_msgs (room_id, kind, body) values ($1, $2, $3)`, [r.id, why === "staff" ? "staff" : "gone", String(tableOf.get(leaving) ?? "")]);
  }
  return ended.length;
}

/**
 * 매장 정리 — 1분에 한 번만(먼저 잡은 요청이 한다). 오래된 자리·신청·허락 대기를 끝낸다.
 * @returns 무엇이든 끝냈으면 true
 */
async function maybeSweep(store: StoreId, now: Date): Promise<boolean> {
  const won = await one<{ store_id: string }>(
    `update tt_state set swept_at=now() where store_id=$1 and (swept_at is null or swept_at < now() - interval '60 seconds') returning store_id`,
    [store],
  );
  if (!won) return false;
  const day = serviceDay(now);
  return tx(async (q) => {
    const old = await q.query<{ id: string; stale: boolean }>(
      `select id, (day < $2::date) as stale from tt_seats where store_id=$1 and status='on' and (day < $2::date or seen_at < now() - interval '${IDLE_END}')`,
      [store, day],
    );
    let changed = 0;
    changed += await endSeats(q, old.filter((r) => r.stale).map((r) => r.id), "day");
    changed += await endSeats(q, old.filter((r) => !r.stale).map((r) => r.id), "idle");
    const asks = await q.query(`update tt_asks set status='gone', decided_at=now() where store_id=$1 and status='wait' and created_at < now() - interval '${ASK_TTL}' returning id`, [store]);
    const joins = await q.query(
      `update tt_devs d set status='no', out_reason='expired', decided_at=now() from tt_seats s
       where s.id = d.seat_id and s.store_id=$1 and d.status='wait' and d.created_at < now() - interval '${JOIN_TTL}' returning d.id`,
      [store],
    );
    if (changed + asks.length + joins.length > 0) {
      await bump(q, store);
      return true;
    }
    return false;
  });
}

/* ───────── 폰(디바이스) ───────── */

export type DevCtx = {
  dev: string;
  status: "in" | "wait" | "out" | "no";
  outReason: string | null;
  seat: string;
  store: StoreId;
  table: number;
  seatOn: boolean;
  seatDay: string;
  startedAt: Date;
  endedBy: string | null;
};

export async function loadDev(dev: string, q: Queryable = { query }): Promise<DevCtx | null> {
  if (!/^[0-9a-f-]{36}$/i.test(dev)) return null;
  const rows = await q.query<{
    id: string; status: DevCtx["status"]; out_reason: string | null; seat_id: string; store_id: StoreId; table_no: number;
    seat_status: string; day: string; started_at: unknown; ended_by: string | null;
  }>(
    `select d.id, d.status, d.out_reason, d.seat_id, s.store_id, s.table_no, s.status as seat_status, s.day::text as day, s.started_at, s.ended_by
     from tt_devs d join tt_seats s on s.id = d.seat_id where d.id = $1`,
    [dev],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    dev: r.id, status: r.status, outReason: r.out_reason, seat: r.seat_id, store: r.store_id, table: Number(r.table_no),
    seatOn: r.seat_status === "on", seatDay: r.day, startedAt: asDate(r.started_at), endedBy: r.ended_by,
  };
}

function liveNow(c: DevCtx, now: Date): boolean {
  return c.seatOn && c.seatDay === serviceDay(now);
}

/** 이 폰이 지금 들어와 있으면 그대로, 아니면 나간 까닭 */
export function outWhy(c: DevCtx | null, now: Date): OutWhy | null {
  if (!c) return "none";
  if (c.status === "no") return c.outReason === "expired" ? "expired" : "denied";
  if (c.status === "out") return (c.outReason as OutWhy) ?? "self";
  if (!liveNow(c, now)) return c.seatDay !== serviceDay(now) ? "day" : ((c.endedBy as OutWhy) ?? "idle");
  return null;
}

async function requireIn(dev: string | null, now: Date, q?: Queryable): Promise<DevCtx> {
  const c = dev ? await loadDev(dev, q) : null;
  const why = outWhy(c, now);
  if (why || !c) throw new TTError("테이블톡에서 나가졌습니다. 테이블 QR 을 다시 찍어 주세요.", 409, "out");
  if (c.status !== "in") throw new TTError("일행의 허락을 기다리는 중입니다.", 409, "waiting");
  return c;
}

/** 폰이 보고 있다는 표시 — 1분에 한 번만 쓴다(인스턴스 안에서 기억) */
const touched = new Map<string, number>();
async function touch(c: DevCtx): Promise<void> {
  const last = touched.get(c.dev) ?? 0;
  if (Date.now() - last < 60_000) return;
  touched.set(c.dev, Date.now());
  if (touched.size > 5000) touched.clear();
  if (c.status === "in") {
    await query(`with d as (update tt_devs set seen_at=now() where id=$1) update tt_seats set seen_at=now() where id=$2`, [c.dev, c.seat]);
  } else {
    await query(`update tt_devs set seen_at=now() where id=$1`, [c.dev]);
  }
}

async function isLocked(q: Queryable, store: StoreId, table: number, day: string): Promise<boolean> {
  const r = await q.query(`select 1 from tt_locks where store_id=$1 and table_no=$2 and day=$3::date`, [store, table, day]);
  return r.length > 0;
}

/** 이 테이블에 지금 열린 자리. 지난 영업일 자리가 아직 'on' 으로 남아 있으면 먼저 닫는다(유니크 인덱스 때문에 새 자리를 못 연다) */
async function liveSeatAt(q: Queryable, store: StoreId, table: number, day: string, lock = false): Promise<SeatRow | null> {
  const stale = await q.query<{ id: string }>(`select id from tt_seats where store_id=$1 and table_no=$2 and status='on' and day < $3::date`, [store, table, day]);
  if (stale.length) await endSeats(q, stale.map((r) => r.id), "day");
  const rows = await q.query<SeatRow>(
    `select id, table_no, started_at, seen_at from tt_seats where store_id=$1 and table_no=$2 and status='on' and day=$3::date ${lock ? "for update" : ""}`,
    [store, table, day],
  );
  return rows[0] ?? null;
}

/* ───────── 입장 ───────── */

export type JoinResult = { dev: string; status: "in" | "wait" };

/**
 * QR 로 들어오기.
 *  start  — 열린 자리가 없다고 보고 누른 [테이블톡 시작]. 그사이 일행이 먼저 열었으면(5분 안) 그 자리로 들어간다
 *  team   — [일행으로 들어가기]. 5분 안이면 바로, 아니면 허락 대기
 *  fresh  — [방금 앉았습니다]. 이전 자리 폰들이 10분 넘게 안 봤을 때만 이전 자리를 닫고 새로 연다
 */
export async function join(ref: TableRef, mode: JoinMode, oldDev: string | null, now: Date = new Date()): Promise<JoinResult> {
  const settings = await getTTSettings();
  if (!settings[ref.store].on) throw new TTError("이 가게는 지금 테이블톡을 쓰지 않습니다.", 403, "off");
  const day = serviceDay(now);
  const old = oldDev ? await loadDev(oldDev) : null;

  const result = await tx(async (q) => {
    if (await isLocked(q, ref.store, ref.table, day)) throw new TTError("이 테이블은 오늘 테이블톡이 막혀 있습니다. 직원에게 말씀해 주세요.", 403, "locked");

    // 이미 이 테이블 자리에 들어와 있는 폰이면 그대로. 허락을 기다리던 폰이 [방금 앉았습니다]를 고른 경우만 아래로 간다
    if (old && old.store === ref.store && old.table === ref.table && liveNow(old, now)) {
      if (old.status === "in") return { dev: old.dev, status: "in" as const, moved: false };
      if (old.status === "wait" && mode !== "fresh") return { dev: old.dev, status: "wait" as const, moved: false };
    }

    let seat = await liveSeatAt(q, ref.store, ref.table, day, true);
    let status: "in" | "wait" = "in";

    if (seat && mode === "fresh") {
      if (now.getTime() - asDate(seat.seen_at).getTime() < QUIET_FOR_NEW_MS) {
        throw new TTError("이 테이블의 이전 대화를 10분 안에 본 폰이 있어 아직 새로 시작할 수 없습니다. 같은 일행이면 [일행으로 들어가기], 아니면 직원에게 비워 달라고 말씀해 주세요.", 409, "busy");
      }
      await endSeats(q, [seat.id], "new");
      seat = null;
    } else if (seat) {
      const young = now.getTime() - asDate(seat.started_at).getTime() < FRESH_JOIN_MS;
      if (!young && mode === "start") throw new TTError("이 테이블에 이미 테이블톡을 쓰는 일행이 있습니다.", 409, "exists");
      status = young ? "in" : "wait";
    }

    if (!seat) {
      const made = await q.query<SeatRow>(
        `insert into tt_seats (store_id, table_no, day) values ($1, $2, $3::date) on conflict do nothing returning id, table_no, started_at, seen_at`,
        [ref.store, ref.table, day],
      );
      // 같은 순간 일행이 먼저 열었다 — 그 자리로(방금 열린 자리라 바로 들어간다)
      seat = made[0] ?? (await liveSeatAt(q, ref.store, ref.table, day, true));
      if (!seat) throw new TTError("잠시 후 다시 시도해 주세요.", 503, "retry");
      status = "in";
    }

    const dev = await q.query<{ id: string }>(`insert into tt_devs (seat_id, status) values ($1, $2) returning id`, [seat.id, status]);
    if (status === "in") await q.query(`update tt_seats set seen_at=now() where id=$1`, [seat.id]);

    // 다른 테이블에 들어가 있던 폰이면 거기서는 나간다. 그 자리에 남은 폰이 없으면 그 자리도 끝낸다
    let moved = false;
    if (old && (old.status === "in" || old.status === "wait") && old.seat !== seat.id) {
      await q.query(`update tt_devs set status = case when status='wait' then 'no' else 'out' end, out_reason='self', decided_at=now() where id=$1`, [old.dev]);
      if (old.status === "in" && liveNow(old, now)) {
        const left = await q.query(`select 1 from tt_devs where seat_id=$1 and status='in' limit 1`, [old.seat]);
        if (left.length === 0) await endSeats(q, [old.seat], "team");
      }
      moved = old.store !== ref.store;
    }
    await bump(q, ref.store);
    if (moved && old) await bump(q, old.store);
    return { dev: dev[0]!.id, status, moved };
  });
  return { dev: result.dev, status: result.status };
}

/** QR 을 열었을 때 입장 화면에 보일 것 */
export async function entryInfo(ref: TableRef, dev: string | null, now: Date = new Date()) {
  const day = serviceDay(now);
  const settings = await getTTSettings();
  const storeName = getStore(ref.store)?.shortName ?? "";
  if (!settings[ref.store].on) return { kind: "off" as const, storeName };
  if (await isLocked({ query }, ref.store, ref.table, day)) return { kind: "locked" as const, storeName, table: ref.table };
  const c = dev ? await loadDev(dev) : null;
  const why = outWhy(c, now);
  if (c && !why && c.store === ref.store && c.table === ref.table) return { kind: "in" as const, dev: c.dev };
  const seat = await one<SeatRow>(`select id, table_no, started_at, seen_at from tt_seats where store_id=$1 and table_no=$2 and status='on' and day=$3::date`, [ref.store, ref.table, day]);
  return {
    kind: "join" as const,
    storeName,
    existing: seat
      ? {
          since: iso(seat.started_at),
          fresh: now.getTime() - asDate(seat.started_at).getTime() < FRESH_JOIN_MS,
          quiet: now.getTime() - asDate(seat.seen_at).getTime() >= QUIET_FOR_NEW_MS,
        }
      : null,
    elsewhere: c && !why ? { storeName: getStore(c.store)?.shortName ?? "", table: c.table } : null,
    why: c && c.store === ref.store && c.table === ref.table ? why : null,
  };
}

/* ───────── 동기화 ───────── */

export type SyncOut =
  | { kind: "state"; state: TTState }
  | { kind: "same"; v: number }
  | { kind: "waiting"; store: StoreId; storeName: string; table: number; since: string }
  | { kind: "out"; why: OutWhy };

/**
 * 화면이 몇 초마다 부른다.
 * @param clientV 화면이 가진 변경 번호(-1 이면 처음 — 전부 다시)
 * @param after 화면이 가진 마지막 글 번호(그 뒤의 글만 준다)
 */
export async function sync(dev: string | null, clientV: number, after: number, now: Date = new Date()): Promise<SyncOut> {
  const c = dev ? await loadDev(dev) : null;
  const why = outWhy(c, now);
  if (why || !c) return { kind: "out", why: why ?? "none" };
  await touch(c);
  // 바뀐 게 없으면 여기까지 두 줄(폰 + 변경 번호)로 끝난다. 정리는 1분에 한 번
  let st = await stateOf(c.store);
  let cur: DevCtx = c;
  if (st.due && (await maybeSweep(c.store, now))) {
    // 정리하다 이 자리가 끝났을 수 있다
    const again = await loadDev(c.dev);
    const why2 = outWhy(again, now);
    if (why2 || !again) return { kind: "out", why: why2 ?? "none" };
    cur = again;
    st = await stateOf(c.store);
  }
  const storeName = getStore(c.store)?.shortName ?? "";
  if (cur.status === "wait") return { kind: "waiting", store: c.store, storeName, table: c.table, since: iso(cur.startedAt) };
  if (clientV === st.v) return { kind: "same", v: st.v };
  return { kind: "state", state: await buildState(cur, st.v, after, now) };
}

async function buildState(c: DevCtx, v: number, after: number, now: Date): Promise<TTState> {
  const day = serviceDay(now);
  const settings = await getTTSettings();
  const me = c.seat;

  const [seats, asks, declined, rooms, blocks, joins, locks, phones] = await Promise.all([
    query<{ id: string; table_no: number }>(`select id, table_no from tt_seats where store_id=$1 and status='on' and day=$2::date`, [c.store, day]),
    query<{ id: string; from_seat: string; to_seat: string; note: string | null; created_at: unknown }>(
      `select id, from_seat, to_seat, note, created_at from tt_asks where status='wait' and (from_seat=$1 or to_seat=$1) order by created_at`,
      [me],
    ),
    query<{ to_seat: string }>(`select to_seat from tt_asks where from_seat=$1 and status='no' and decided_at > now() - interval '${COOLDOWN}'`, [me]),
    query<{ id: string; status: string; created_at: unknown; closed_at: unknown; close_reason: string | null; closed_by: string | null; other: string; other_table: number; last: string | number }>(
      `select r.id, r.status, r.created_at, r.closed_at, r.close_reason, r.closed_by,
              case when r.seat_a = $1 then r.seat_b else r.seat_a end as other, o.table_no as other_table,
              coalesce((select max(m.id) from tt_msgs m where m.room_id = r.id), 0) as last
       from tt_rooms r join tt_seats o on o.id = (case when r.seat_a = $1 then r.seat_b else r.seat_a end)
       where (r.seat_a = $1 or r.seat_b = $1) and (r.status = 'open' or r.closed_at > now() - interval '${ROOM_SHOW}')
       order by r.created_at`,
      [me],
    ),
    query<{ seat_id: string; other_seat: string }>(`select seat_id, other_seat from tt_blocks where seat_id=$1 or other_seat=$1`, [me]),
    query<{ id: string; created_at: unknown }>(`select id, created_at from tt_devs where seat_id=$1 and status='wait' and created_at > now() - interval '${JOIN_TTL}' order by created_at`, [me]),
    query<{ table_no: number }>(`select table_no from tt_locks where store_id=$1 and day=$2::date`, [c.store, day]),
    one<{ n: number }>(`select count(*)::int as n from tt_devs where seat_id=$1 and status='in'`, [me]),
  ]);

  const tableOfSeat = new Map(seats.map((s) => [s.id, Number(s.table_no)]));
  const seatOfTable = new Map(seats.map((s) => [Number(s.table_no), s.id]));
  const roomIds = rooms.map((r) => r.id);
  // 처음(after=0)이면 최근 600줄, 아니면 after 뒤로 600줄. 하룻밤 대화가 600줄을 넘을 일은 드물다
  const cursor = Math.max(0, Math.floor(after));
  const msgRows = roomIds.length
    ? await query<{ id: string | number; room_id: string; seat_id: string | null; kind: string | null; body: string; nonce: string | null; created_at: unknown }>(
        cursor === 0
          ? `select * from (select id, room_id, seat_id, kind, body, nonce, created_at from tt_msgs where room_id = any($1::uuid[]) order by id desc limit 600) t order by id`
          : `select id, room_id, seat_id, kind, body, nonce, created_at from tt_msgs where room_id = any($1::uuid[]) and id > $2 order by id limit 600`,
        cursor === 0 ? [roomIds] : [roomIds, cursor],
      )
    : [];

  const openWith = new Map<string, string>();
  const closedRecently = new Set<string>();
  const roomOut: Room[] = rooms.map((r) => {
    const open = r.status === "open";
    if (open) openWith.set(r.other, r.id);
    else if (r.closed_at && now.getTime() - asDate(r.closed_at).getTime() < 15 * 60_000) closedRecently.add(r.other);
    const reason = (r.close_reason === "blocked" || r.close_reason === "reported" ? "end" : r.close_reason) as CloseReason | null;
    return {
      id: r.id, with: Number(r.other_table), open, at: iso(r.created_at), last: Number(r.last),
      ...(open ? {} : { reason: reason ?? "left", byUs: r.closed_by === me }),
    };
  });

  const asksIn: AskIn[] = [];
  const asksOut: AskOut[] = [];
  const gotFrom = new Map<string, string>();
  const sentTo = new Map<string, string>();
  for (const a of asks) {
    if (a.to_seat === me) {
      const t = tableOfSeat.get(a.from_seat);
      if (t == null) continue;
      asksIn.push({ id: a.id, from: t, note: a.note, at: iso(a.created_at) });
      gotFrom.set(a.from_seat, a.id);
    } else {
      const t = tableOfSeat.get(a.to_seat);
      if (t == null) continue;
      asksOut.push({ id: a.id, to: t, at: iso(a.created_at) });
      sentTo.set(a.to_seat, a.id);
    }
  }
  const blocked = new Set(blocks.map((b) => (b.seat_id === me ? b.other_seat : b.seat_id)));
  const cooling = new Set([...declined.map((d) => d.to_seat), ...closedRecently]);
  const locked = new Set(locks.map((l) => Number(l.table_no)));

  const maxNo = Math.max(settings[c.store].tables, c.table, ...seats.map((s) => Number(s.table_no)));
  const tiles: Tile[] = [];
  for (let no = 1; no <= maxNo; no++) {
    if (no === c.table) {
      tiles.push({ no, state: "me" });
      continue;
    }
    if (locked.has(no)) {
      tiles.push({ no, state: "off" });
      continue;
    }
    const seat = seatOfTable.get(no);
    if (!seat) tiles.push({ no, state: "empty" });
    else if (blocked.has(seat)) tiles.push({ no, state: "off" });
    else if (openWith.has(seat)) tiles.push({ no, state: "talk", room: openWith.get(seat) });
    else if (gotFrom.has(seat)) tiles.push({ no, state: "got", ask: gotFrom.get(seat) });
    else if (sentTo.has(seat)) tiles.push({ no, state: "sent", ask: sentTo.get(seat) });
    else if (cooling.has(seat)) tiles.push({ no, state: "wait" });
    else tiles.push({ no, state: "on" });
  }

  const msgs: Msg[] = msgRows.map((m) => {
    const base = { id: Number(m.id), room: m.room_id, at: iso(m.created_at) };
    if (m.kind) {
      const t = Number(m.body);
      return { ...base, mine: false, body: "", sys: m.kind as SysKind, ...(Number.isInteger(t) && t > 0 ? { sysTable: t } : {}) };
    }
    return { ...base, mine: m.seat_id === me, body: m.body, ...(m.nonce ? { nonce: m.nonce } : {}) };
  });

  const joinsOut: JoinWait[] = joins.map((j) => ({ id: j.id, at: iso(j.created_at) }));

  return {
    v,
    store: c.store,
    storeName: getStore(c.store)?.shortName ?? "",
    table: c.table,
    since: iso(c.startedAt),
    phones: phones?.n ?? 1,
    tiles,
    asks: asksIn,
    sent: asksOut,
    rooms: roomOut,
    msgs,
    joins: joinsOut,
  };
}

/* ───────── 말 걸기 ───────── */

async function openRoomCount(q: Queryable, seat: string): Promise<number> {
  const r = await q.query<{ n: number }>(`select count(*)::int as n from tt_rooms where status='open' and (seat_a=$1 or seat_b=$1)`, [seat]);
  return r[0]?.n ?? 0;
}

/** 두 자리의 방을 연다(이미 열려 있으면 그 방). 새로 열었을 때만 "대화가 시작됐습니다" 줄을 남긴다 */
async function openRoom(q: Queryable, store: StoreId, a: string, b: string): Promise<string> {
  const made = await q.query<{ id: string }>(
    `insert into tt_rooms (store_id, seat_a, seat_b) values ($1, $2, $3) on conflict do nothing returning id`,
    [store, a, b],
  );
  if (made[0]) {
    await q.query(`insert into tt_msgs (room_id, kind, body) values ($1, 'start', '')`, [made[0].id]);
    return made[0].id;
  }
  const r = await q.query<{ id: string }>(
    `select id from tt_rooms where status='open' and least(seat_a, seat_b) = least($1::uuid, $2::uuid) and greatest(seat_a, seat_b) = greatest($1::uuid, $2::uuid)`,
    [a, b],
  );
  if (!r[0]) throw new TTError("잠시 후 다시 시도해 주세요.", 503, "retry");
  return r[0].id;
}

async function blockedEither(q: Queryable, a: string, b: string): Promise<boolean> {
  const r = await q.query(`select 1 from tt_blocks where (seat_id=$1 and other_seat=$2) or (seat_id=$2 and other_seat=$1) limit 1`, [a, b]);
  return r.length > 0;
}

export async function ask(dev: string | null, toTable: number, noteRaw: unknown, now: Date = new Date()): Promise<void> {
  const c = await requireIn(dev, now);
  if (!Number.isInteger(toTable) || toTable < 1) throw new TTError("테이블 번호가 맞지 않습니다.");
  if (toTable === c.table) throw new TTError("우리 테이블입니다.");
  const note = cleanNote(noteRaw) || null;
  if (!(await rateLimit(`tt-ask:${c.seat}`, 12, 3600))) throw new TTError("말 걸기를 너무 많이 했습니다. 잠시 뒤에 다시 해 주세요.", 429, "rate");
  const day = serviceDay(now);
  await tx(async (q) => {
    if (await isLocked(q, c.store, toTable, day)) throw new TTError("지금은 그 테이블에 말을 걸 수 없습니다.", 409, "off");
    const target = await liveSeatAt(q, c.store, toTable, day);
    if (!target) throw new TTError(`${toTable}번 테이블은 지금 테이블톡을 쓰지 않습니다.`, 409, "empty");
    if (await blockedEither(q, c.seat, target.id)) throw new TTError("지금은 그 테이블에 말을 걸 수 없습니다.", 409, "off");
    const open = await q.query(`select 1 from tt_rooms where status='open' and least(seat_a, seat_b) = least($1::uuid, $2::uuid) and greatest(seat_a, seat_b) = greatest($1::uuid, $2::uuid)`, [c.seat, target.id]);
    if (open.length) return;

    // 상대가 이미 우리에게 신청해 둔 상태면 서로 원한 것 — 바로 방을 연다
    const reverse = await q.query<{ id: string }>(`select id from tt_asks where from_seat=$1 and to_seat=$2 and status='wait' for update`, [target.id, c.seat]);
    if (reverse[0]) {
      await assertRoomRoom(q, c.seat, target.id);
      await openRoom(q, c.store, target.id, c.seat);
      await q.query(`update tt_asks set status='ok', decided_at=now() where id=$1`, [reverse[0].id]);
      await bump(q, c.store);
      return;
    }

    const cool = await q.query(
      `select 1 from tt_asks where from_seat=$1 and to_seat=$2 and status='no' and decided_at > now() - interval '${COOLDOWN}'
       union all
       select 1 from tt_rooms where status='closed' and closed_at > now() - interval '${COOLDOWN}'
         and least(seat_a, seat_b) = least($1::uuid, $2::uuid) and greatest(seat_a, seat_b) = greatest($1::uuid, $2::uuid)
       limit 1`,
      [c.seat, target.id],
    );
    if (cool.length) throw new TTError("방금 끝난 테이블입니다. 15분 뒤에 다시 말을 걸 수 있습니다.", 409, "wait");
    const pend = await q.query<{ n: number }>(`select count(*)::int as n from tt_asks where from_seat=$1 and status='wait'`, [c.seat]);
    if ((pend[0]?.n ?? 0) >= MAX_SENT) throw new TTError(`답을 기다리는 신청이 ${MAX_SENT}개입니다. 답이 오거나 취소한 뒤에 거세요.`, 409, "many");
    if ((await openRoomCount(q, c.seat)) >= MAX_OPEN_ROOMS) throw new TTError(`대화방은 ${MAX_OPEN_ROOMS}개까지 열 수 있습니다.`, 409, "rooms");
    await q.query(`insert into tt_asks (store_id, from_seat, to_seat, note) values ($1, $2, $3, $4) on conflict do nothing`, [c.store, c.seat, target.id, note]);
    await bump(q, c.store);
  });
}

async function assertRoomRoom(q: Queryable, a: string, b: string): Promise<void> {
  if ((await openRoomCount(q, a)) >= MAX_OPEN_ROOMS || (await openRoomCount(q, b)) >= MAX_OPEN_ROOMS) {
    throw new TTError(`대화방은 ${MAX_OPEN_ROOMS}개까지 열 수 있습니다. 끝난 대화를 나간 뒤에 해 주세요.`, 409, "rooms");
  }
}

/** 받은 신청에 답하기. 일행 폰이 먼저 답했으면 아무 일도 하지 않는다 */
export async function answer(dev: string | null, askId: unknown, ok: boolean, now: Date = new Date()): Promise<void> {
  const c = await requireIn(dev, now);
  if (typeof askId !== "string" || !/^[0-9a-f-]{36}$/i.test(askId)) throw new TTError("신청을 찾을 수 없습니다.", 404);
  await tx(async (q) => {
    const rows = await q.query<{ id: string; from_seat: string; to_seat: string; status: string }>(`select id, from_seat, to_seat, status from tt_asks where id=$1 for update`, [askId]);
    const a = rows[0];
    if (!a || a.to_seat !== c.seat) throw new TTError("신청을 찾을 수 없습니다.", 404);
    if (a.status !== "wait") return;
    if (!ok) {
      await q.query(`update tt_asks set status='no', decided_at=now() where id=$1`, [a.id]);
      await bump(q, c.store);
      return;
    }
    const from = await q.query(`select 1 from tt_seats where id=$1 and status='on' and day=$2::date`, [a.from_seat, serviceDay(now)]);
    if (!from.length) {
      await q.query(`update tt_asks set status='gone', decided_at=now() where id=$1`, [a.id]);
      await bump(q, c.store);
      throw new TTError("그 테이블이 자리를 떠났습니다.", 409, "gone");
    }
    await assertRoomRoom(q, a.from_seat, c.seat);
    await openRoom(q, c.store, a.from_seat, c.seat);
    await q.query(`update tt_asks set status='ok', decided_at=now() where id=$1 or (from_seat=$2 and to_seat=$3 and status='wait')`, [a.id, c.seat, a.from_seat]);
    await bump(q, c.store);
  });
}

export async function cancelAsk(dev: string | null, askId: unknown, now: Date = new Date()): Promise<void> {
  const c = await requireIn(dev, now);
  if (typeof askId !== "string" || !/^[0-9a-f-]{36}$/i.test(askId)) return;
  await tx(async (q) => {
    const r = await q.query(`update tt_asks set status='cancel', decided_at=now() where id=$1 and from_seat=$2 and status='wait' returning id`, [askId, c.seat]);
    if (r.length) await bump(q, c.store);
  });
}

/* ───────── 대화방 ───────── */

async function myRoom(q: Queryable, c: DevCtx, roomId: unknown): Promise<{ id: string; status: string; other: string }> {
  if (typeof roomId !== "string" || !/^[0-9a-f-]{36}$/i.test(roomId)) throw new TTError("대화방을 찾을 수 없습니다.", 404);
  const r = await q.query<{ id: string; status: string; seat_a: string; seat_b: string }>(`select id, status, seat_a, seat_b from tt_rooms where id=$1`, [roomId]);
  const room = r[0];
  if (!room || (room.seat_a !== c.seat && room.seat_b !== c.seat)) throw new TTError("대화방을 찾을 수 없습니다.", 404);
  return { id: room.id, status: room.status, other: room.seat_a === c.seat ? room.seat_b : room.seat_a };
}

export async function send(dev: string | null, roomId: unknown, bodyRaw: unknown, nonce: string | null, now: Date = new Date()): Promise<void> {
  const c = await requireIn(dev, now);
  const body = cleanMessage(bodyRaw);
  if (!body) throw new TTError("보낼 글이 없습니다.");
  if (!(await rateLimit(`tt-msg:${c.dev}`, 10, 15))) throw new TTError("너무 빨리 보내고 있습니다. 잠깐 쉬었다 보내 주세요.", 429, "rate");
  if (!(await rateLimit(`tt-msg-seat:${c.seat}`, 60, 60))) throw new TTError("너무 빨리 보내고 있습니다. 잠깐 쉬었다 보내 주세요.", 429, "rate");
  await tx(async (q) => {
    const room = await myRoom(q, c, roomId);
    if (room.status !== "open") throw new TTError("대화가 끝났습니다.", 409, "closed");
    const r = await q.query<{ id: string }>(
      `insert into tt_msgs (room_id, seat_id, dev, body, nonce) values ($1, $2, $3, $4, $5)
       on conflict (room_id, nonce) where nonce is not null do nothing returning id`,
      [room.id, c.seat, c.dev, body, nonce],
    );
    if (r.length) await bump(q, c.store);
  });
}

/** 대화방 닫기 — 나가기(left) · 차단(end) · 신고(end, 직원에게 남김) */
export async function closeRoom(dev: string | null, roomId: unknown, how: "leave" | "block" | "report", now: Date = new Date()): Promise<void> {
  const c = await requireIn(dev, now);
  await tx(async (q) => {
    const room = await myRoom(q, c, roomId);
    if (how === "report") {
      const lines = await q.query<{ seat_id: string | null; kind: string | null; body: string; created_at: unknown }>(
        `select seat_id, kind, body, created_at from tt_msgs where room_id=$1 order by id desc limit 40`,
        [room.id],
      );
      const other = await q.query<{ table_no: number }>(`select table_no from tt_seats where id=$1`, [room.other]);
      const otherNo = Number(other[0]?.table_no ?? 0);
      const snap = lines
        .reverse()
        .filter((l) => !l.kind)
        .map((l) => ({ at: iso(l.created_at), table: l.seat_id === c.seat ? c.table : otherNo, body: l.body }));
      await q.query(
        `insert into tt_reports (store_id, day, by_table, on_table, on_seat, lines) values ($1, $2::date, $3, $4, $5, $6::jsonb)`,
        [c.store, serviceDay(now), c.table, otherNo, room.other, JSON.stringify(snap)],
      );
    }
    if (how !== "leave") {
      await q.query(`insert into tt_blocks (seat_id, other_seat) values ($1, $2) on conflict do nothing`, [c.seat, room.other]);
      await q.query(`update tt_asks set status='gone', decided_at=now() where status='wait' and ((from_seat=$1 and to_seat=$2) or (from_seat=$2 and to_seat=$1))`, [c.seat, room.other]);
    }
    if (room.status === "open") {
      const reason = how === "leave" ? "left" : how === "block" ? "blocked" : "reported";
      await q.query(`update tt_rooms set status='closed', closed_at=now(), closed_by=$2, close_reason=$3 where id=$1 and status='open'`, [room.id, c.seat, reason]);
      await q.query(`insert into tt_msgs (room_id, kind, body) values ($1, $2, $3)`, [room.id, how === "leave" ? "left" : "end", how === "leave" ? String(c.table) : ""]);
    }
    await bump(q, c.store);
  });
}

/* ───────── 우리 테이블 ───────── */

/** 허락 기다리는 새 폰 받기/거절 */
export async function admit(dev: string | null, joinDev: unknown, ok: boolean, now: Date = new Date()): Promise<void> {
  const c = await requireIn(dev, now);
  if (typeof joinDev !== "string" || !/^[0-9a-f-]{36}$/i.test(joinDev)) throw new TTError("요청을 찾을 수 없습니다.", 404);
  await tx(async (q) => {
    const r = await q.query(
      `update tt_devs set status=$3, out_reason = case when $3='no' then 'denied' else null end, decided_at=now(), seen_at=now()
       where id=$1 and seat_id=$2 and status='wait' returning id`,
      [joinDev, c.seat, ok ? "in" : "no"],
    );
    if (r.length) await bump(q, c.store);
  });
}

/** 이 폰만 나가기 — 마지막 폰이면 자리도 끝난다 */
export async function leaveDevice(dev: string | null, now: Date = new Date()): Promise<void> {
  const c = dev ? await loadDev(dev) : null;
  if (!c) return;
  await tx(async (q) => {
    await q.query(`update tt_devs set status = case when status='wait' then 'no' else 'out' end, out_reason='self', decided_at=now() where id=$1 and status in ('in','wait')`, [c.dev]);
    if (c.status === "in" && liveNow(c, now)) {
      const left = await q.query(`select 1 from tt_devs where seat_id=$1 and status='in' limit 1`, [c.seat]);
      if (left.length === 0) await endSeats(q, [c.seat], "team");
    }
    await bump(q, c.store);
  });
}

/** 자리 떠나기 — 우리 테이블 폰 모두 나가고 대화방도 모두 닫힌다 */
export async function endTeam(dev: string | null, now: Date = new Date()): Promise<void> {
  const c = await requireIn(dev, now);
  await tx(async (q) => {
    await endSeats(q, [c.seat], "team");
    await bump(q, c.store);
  });
}

/* ───────── 직원 ───────── */

export type AdminSeat = { table: number; seat: string; since: string; seen: string; phones: number; waiting: number; rooms: number; talkingWith: number[] };
export type AdminReport = { id: string; at: string; byTable: number; onTable: number; lines: { at: string; table: number; body: string }[]; resolved: boolean };

export async function adminView(store: StoreId, now: Date = new Date()) {
  const day = serviceDay(now);
  await maybeSweep(store, now).catch(() => {});
  const [seats, locks, reports] = await Promise.all([
    query<{ id: string; table_no: number; started_at: unknown; seen_at: unknown; phones: number; waiting: number }>(
      `select s.id, s.table_no, s.started_at, s.seen_at,
              (select count(*)::int from tt_devs d where d.seat_id = s.id and d.status='in') as phones,
              (select count(*)::int from tt_devs d where d.seat_id = s.id and d.status='wait') as waiting
       from tt_seats s where s.store_id=$1 and s.status='on' and s.day=$2::date order by s.table_no`,
      [store, day],
    ),
    query<{ table_no: number }>(`select table_no from tt_locks where store_id=$1 and day=$2::date order by table_no`, [store, day]),
    query<{ id: string; created_at: unknown; by_table: number; on_table: number; lines: unknown; resolved_at: unknown }>(
      `select id, created_at, by_table, on_table, lines, resolved_at from tt_reports
       where store_id=$1 and (resolved_at is null or created_at > now() - interval '24 hours') order by created_at desc limit 30`,
      [store],
    ),
  ]);
  const seatIds = seats.map((s) => s.id);
  const rooms = seatIds.length
    ? await query<{ seat_a: string; seat_b: string }>(`select seat_a, seat_b from tt_rooms where status='open' and (seat_a = any($1::uuid[]) or seat_b = any($1::uuid[]))`, [seatIds])
    : [];
  const tableOf = new Map(seats.map((s) => [s.id, Number(s.table_no)]));
  const out: AdminSeat[] = seats.map((s) => {
    const mine = rooms.filter((r) => r.seat_a === s.id || r.seat_b === s.id);
    return {
      table: Number(s.table_no), seat: s.id, since: iso(s.started_at), seen: iso(s.seen_at), phones: Number(s.phones), waiting: Number(s.waiting),
      rooms: mine.length,
      talkingWith: mine.map((r) => tableOf.get(r.seat_a === s.id ? r.seat_b : r.seat_a) ?? 0).filter(Boolean).sort((a, b) => a - b),
    };
  });
  const parsedReports: AdminReport[] = reports.map((r) => ({
    id: r.id, at: iso(r.created_at), byTable: Number(r.by_table), onTable: Number(r.on_table),
    lines: (Array.isArray(r.lines) ? r.lines : typeof r.lines === "string" ? JSON.parse(r.lines) : []) as AdminReport["lines"],
    resolved: r.resolved_at != null,
  }));
  return { seats: out, locks: locks.map((l) => Number(l.table_no)), reports: parsedReports };
}

export async function openReportCount(store: StoreId | null): Promise<number> {
  const r = await one<{ n: number }>(
    `select count(*)::int as n from tt_reports where resolved_at is null and created_at > now() - interval '3 days' ${store ? "and store_id=$1" : ""}`,
    store ? [store] : [],
  );
  return r?.n ?? 0;
}

/** 직원이 테이블 비우기 — 손님이 나갔는데 자리가 남아 있을 때, 또는 문제 테이블을 내보낼 때 */
export async function adminClear(store: StoreId, table: number, now: Date = new Date()): Promise<boolean> {
  const day = serviceDay(now);
  return tx(async (q) => {
    const seat = await liveSeatAt(q, store, table, day, true);
    if (!seat) return false;
    await endSeats(q, [seat.id], "staff");
    await bump(q, store);
    return true;
  });
}

/** 오늘 이 테이블 막기/풀기. 막으면 열린 자리도 비운다 */
export async function adminLock(store: StoreId, table: number, on: boolean, adminId: string, now: Date = new Date()): Promise<void> {
  const day = serviceDay(now);
  await tx(async (q) => {
    if (on) {
      await q.query(`insert into tt_locks (store_id, table_no, day, by_admin) values ($1, $2, $3::date, $4) on conflict do nothing`, [store, table, day, adminId]);
      const seat = await liveSeatAt(q, store, table, day, true);
      if (seat) await endSeats(q, [seat.id], "staff");
    } else {
      await q.query(`delete from tt_locks where store_id=$1 and table_no=$2 and day=$3::date`, [store, table, day]);
    }
    await bump(q, store);
  });
}

export async function adminResolveReport(id: string, store: StoreId | null, adminId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const r = await query(
    `update tt_reports set resolved_at=now(), resolved_by=$2 where id=$1 and resolved_at is null ${store ? "and store_id=$3" : ""} returning id`,
    store ? [id, adminId, store] : [id, adminId],
  );
  return r.length > 0;
}

/**
 * 보관 정리(크론, 매일 한국 새벽 3시) — 어제 영업일까지만 남기고 그 전 것은 지운다.
 * 영업일은 다음날 낮 12시에 닫히므로, 닫힌 대화는 이틀 안에 지워진다. 신고(복사해 둔 글)는 14일.
 */
export async function purgeTableTalk(now: Date = new Date()): Promise<{ seats: number; reports: number }> {
  const keepFrom = serviceDay(new Date(now.getTime() - 86400 * 1000));
  const seats = await query(`delete from tt_seats where day < $1::date returning id`, [keepFrom]);
  await query(`delete from tt_locks where day < $1::date`, [keepFrom]);
  const reports = await query(`delete from tt_reports where created_at < now() - interval '14 days' returning id`);
  await query(`delete from tt_usage where day < $1::date`, [serviceDay(new Date(now.getTime() - 45 * 86400 * 1000))]);
  return { seats: seats.length, reports: reports.length };
}
