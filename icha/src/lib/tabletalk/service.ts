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
 * 화면은 몇 초마다 sync() 로 묻는다. 자리마다 변경 번호(tt_seats.v)가 있어, 바뀐 게 없으면 한 줄 읽고 끝낸다.
 * 쓰기는 맨 앞에서 매장 줄(tt_state)을 잠가 한 줄로 선다(lockStores) — 동시에 누른 두 폰이 서로를 못 보고 엇갈리지 않고,
 * 글 번호가 커밋 순서대로 보인다(화면은 "마지막 글 번호 뒤"만 받으므로, 늦게 커밋된 앞 번호 글이 있으면 놓친다).
 * 쓰기가 끝나면 볼 것이 바뀐 자리만 번호를 바꾼다(bumpSeats). 자리가 열리고 닫히는 것처럼 번호판 전체가 바뀌면 매장 전체(bumpStore).
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
/**
 * [새로 앉았습니다] — 이 시간 넘게 그 자리 폰이 아무도 안 봤을 때만 이전 자리를 닫을 수 있다.
 * 폰을 주머니에 넣고 마시는 일행을, 테이블 주소를 가진 다른 사람이 밀어내지 못할 만큼 길게
 */
export const QUIET_FOR_NEW_MS = 20 * 60_000;
/** 사이트에서 번호를 골라 온 폰의 [방금 앉았습니다] — 그 주소는 가게 밖에서도 받을 수 있어 훨씬 오래 조용해야 한다 */
export const PICK_QUIET_FOR_NEW_MS = 60 * 60_000;
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

/**
 * 차단이 아직 살아 있나(tt_blocks b 한 줄에 붙이는 조건). 막힌 테이블에 직원이 비웠거나·새 일행이 [방금 앉았습니다]로 앉았거나·
 * 3시간 비어 끝난 일이 차단 뒤에 있었으면 그 테이블은 다른 손님이라 풀린다. [자리 떠나기] 뒤 다시 찍은 것은 같은 손님일 수 있어 그대로 막는다
 */
const BLOCK_LIVE = `not exists (select 1 from tt_seats z where z.store_id = bs.store_id and z.table_no = b.other_table
  and z.ended_by in ('staff','new','idle') and z.ended_at > b.created_at)`;

/* ───────── 잠금 · 변경 번호 · 정리 ───────── */

/** 쓰기 트랜잭션 맨 앞에서 매장을 잠근다. 두 매장이면(다른 매장 테이블로 옮기는 폰) 이름 순서로 — 서로 기다리다 멈추지 않게 */
async function lockStores(q: Queryable, ...stores: StoreId[]): Promise<void> {
  for (const s of [...new Set(stores)].sort()) {
    const r = await q.query(`select 1 from tt_state where store_id=$1 for update`, [s]);
    // 매장 줄이 없으면 만들면서 잠근다(새 매장을 넣고 아직 다시 기동하지 않았을 때)
    if (!r.length) await q.query(`insert into tt_state (store_id) values ($1) on conflict (store_id) do update set store_id = excluded.store_id`, [s]);
  }
}

/** 이 자리들의 화면이 바뀌었다 — 그 자리 폰들만 다음에 물을 때 새로 받는다 */
async function bumpSeats(q: Queryable, seatIds: (string | null | undefined)[]): Promise<void> {
  const ids = [...new Set(seatIds.filter((x): x is string => typeof x === "string"))];
  if (ids.length) await q.query(`update tt_seats set v = nextval('tt_v_seq') where id = any($1::uuid[]) and status='on'`, [ids]);
}

/** 번호판이 바뀌었다(자리가 열림·닫힘, 직원이 막음·풂) — 그 매장 열린 자리 전부 */
async function bumpStore(q: Queryable, store: StoreId): Promise<void> {
  await q.query(`update tt_seats set v = nextval('tt_v_seq') where store_id=$1 and status='on'`, [store]);
}

/**
 * 자리 끝내기 — 폰들을 내보내고, 기다리던 신청을 거두고, 열린 대화방을 닫으며 상대 방에 "N번 테이블이 자리를 떠났습니다"를 남긴다.
 * @returns 실제로 끝낸 자리 수
 */
async function endSeats(q: Queryable, seatIds: string[], why: Exclude<OutWhy, "none" | "denied" | "expired" | "locked" | "off">): Promise<number> {
  if (seatIds.length === 0) return 0;
  const ended = await q.query<{ id: string; table_no: number; store_id: StoreId }>(
    `update tt_seats set status='off', ended_at=now(), ended_by=$2 where id = any($1::uuid[]) and status='on' returning id, table_no, store_id`,
    [seatIds, why],
  );
  if (ended.length === 0) return 0;
  const ids = ended.map((r) => r.id);
  await q.query(`update tt_devs set status = case when status='wait' then 'no' else 'out' end, out_reason=$2, decided_at=now() where seat_id = any($1::uuid[]) and status in ('in','wait')`, [ids, why]);
  await q.query(`update tt_asks set status='gone', decided_at=now() where status='wait' and (from_seat = any($1::uuid[]) or to_seat = any($1::uuid[]))`, [ids]);
  const rooms = await q.query<{ id: string; seat_a: string; seat_b: string }>(
    `update tt_rooms set status='closed', closed_at=now(), close_reason = case when $2 = 'staff' then 'staff' else 'gone' end,
       closed_by = case when seat_a = any($1::uuid[]) then seat_a else seat_b end
     where status='open' and (seat_a = any($1::uuid[]) or seat_b = any($1::uuid[])) returning id, seat_a, seat_b`,
    [ids, why],
  );
  const tableOf = new Map(ended.map((r) => [r.id, Number(r.table_no)]));
  for (const r of rooms) {
    const leaving = tableOf.has(r.seat_a) ? r.seat_a : r.seat_b;
    await q.query(`insert into tt_msgs (room_id, kind, body) values ($1, $2, $3)`, [r.id, why === "staff" ? "staff" : "gone", String(tableOf.get(leaving) ?? "")]);
  }
  for (const store of new Set(ended.map((r) => r.store_id))) await bumpStore(q, store);
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
    await lockStores(q, store);
    const old = await q.query<{ id: string; stale: boolean }>(
      `select id, (day < $2::date) as stale from tt_seats where store_id=$1 and status='on' and (day < $2::date or seen_at < now() - interval '${IDLE_END}')`,
      [store, day],
    );
    let changed = 0;
    changed += await endSeats(q, old.filter((r) => r.stale).map((r) => r.id), "day");
    changed += await endSeats(q, old.filter((r) => !r.stale).map((r) => r.id), "idle");
    const asks = await q.query<{ from_seat: string; to_seat: string }>(
      `update tt_asks set status='gone', decided_at=now() where store_id=$1 and status='wait' and created_at < now() - interval '${ASK_TTL}' returning from_seat, to_seat`,
      [store],
    );
    const joins = await q.query<{ seat_id: string }>(
      `update tt_devs d set status='no', out_reason='expired', decided_at=now() from tt_seats s
       where s.id = d.seat_id and s.store_id=$1 and d.status='wait' and d.created_at < now() - interval '${JOIN_TTL}' returning d.seat_id`,
      [store],
    );
    await bumpSeats(q, [...asks.flatMap((a) => [a.from_seat, a.to_seat]), ...joins.map((j) => j.seat_id)]);
    return changed + asks.length + joins.length > 0;
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
  /** 이 자리 화면의 변경 번호 */
  v: number;
  /** 매장 정리(1분에 한 번)할 때가 됐나 — DB 시계 기준 */
  due: boolean;
};

export async function loadDev(dev: string, q: Queryable = { query }): Promise<DevCtx | null> {
  if (!/^[0-9a-f-]{36}$/i.test(dev)) return null;
  const rows = await q.query<{
    id: string; status: DevCtx["status"]; out_reason: string | null; seat_id: string; store_id: StoreId; table_no: number;
    seat_status: string; day: string; started_at: unknown; ended_by: string | null; v: string | number; due: boolean | null;
  }>(
    `select d.id, d.status, d.out_reason, d.seat_id, s.store_id, s.table_no, s.status as seat_status, s.day::text as day, s.started_at, s.ended_by, s.v,
            (st.swept_at is null or st.swept_at < now() - interval '60 seconds') as due
     from tt_devs d join tt_seats s on s.id = d.seat_id left join tt_state st on st.store_id = s.store_id where d.id = $1`,
    [dev],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    dev: r.id, status: r.status, outReason: r.out_reason, seat: r.seat_id, store: r.store_id, table: Number(r.table_no),
    seatOn: r.seat_status === "on", seatDay: r.day, startedAt: asDate(r.started_at), endedBy: r.ended_by,
    v: Number(r.v), due: r.due !== false,
  };
}

function liveNow(c: DevCtx, now: Date): boolean {
  return c.seatOn && c.seatDay === serviceDay(now);
}

/** 이 폰이 지금 들어와 있으면 그대로, 아니면 나간 까닭 */
export function outWhy(c: DevCtx | null, now: Date): OutWhy | null {
  if (!c) return "none";
  // 허락 대기였던 폰: 거절(denied)·시간 지남(expired)·스스로 그만둠(self)·자리가 끝남(team·staff 등) 그대로
  if (c.status === "no") return (c.outReason as OutWhy | null) ?? "denied";
  if (c.status === "out") return (c.outReason as OutWhy | null) ?? "self";
  if (!liveNow(c, now)) return c.seatDay !== serviceDay(now) ? "day" : ((c.endedBy as OutWhy) ?? "idle");
  return null;
}

function assertIn(c: DevCtx | null, now: Date): DevCtx {
  const why = outWhy(c, now);
  if (why || !c) throw new TTError("테이블톡에서 나가졌습니다. 테이블 QR 을 다시 찍어 주세요.", 409, "out");
  if (c.status !== "in") throw new TTError("일행의 허락을 기다리는 중입니다.", 409, "waiting");
  return c;
}

async function requireIn(dev: string | null, now: Date): Promise<DevCtx> {
  const c = assertIn(dev ? await loadDev(dev) : null, now);
  if (!(await getTTSettings())[c.store].on) throw new TTError("이 가게는 지금 테이블톡을 쓰지 않습니다.", 409, "out");
  return c;
}

/**
 * 쓰기 트랜잭션 맨 앞 — 매장을 잠근 뒤 이 폰을 다시 읽는다(잠그기 전에 자리가 끝났거나 직원이 막았을 수 있다).
 * 트랜잭션 안에서는 q 로만 읽는다 — 로컬 PGlite 는 트랜잭션이 열려 있는 동안 바깥 쿼리를 기다리게 해 서로 멈춘다
 */
async function enter(q: Queryable, c: DevCtx, now: Date): Promise<DevCtx> {
  await lockStores(q, c.store);
  return assertIn(await loadDev(c.dev, q), now);
}

/** 폰이 보고 있다는 표시 — 1분에 한 번만 쓴다(인스턴스 안에서 기억) */
const touched = new Map<string, number>();
async function touch(c: DevCtx): Promise<void> {
  const last = touched.get(c.dev) ?? 0;
  if (Date.now() - last < 60_000) return;
  touched.set(c.dev, Date.now());
  if (touched.size > 5000) touched.clear();
  // 한 문장에 한 줄씩 — 같은 줄을 잡은 쓰기 트랜잭션과 서로 기다리다 멈추지 않게
  await query(`update tt_devs set seen_at=now() where id=$1`, [c.dev]);
  if (c.status === "in") await query(`update tt_seats set seen_at=now() where id=$1`, [c.seat]);
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
 *  fresh  — [방금 앉았습니다]. 이전 자리 폰들이 20분 넘게 안 봤을 때만 이전 자리를 닫고 새로 연다
 * 사이트에서 번호를 골라 온 폰(ref.via = "pick")은 테이블에 앉았다는 증거가 없다 — 열린 자리에는 언제나 허락을 받아 들어가고,
 * [방금 앉았습니다]는 60분 조용해야 된다. 빈 테이블을 여는 것은 같다.
 */
export async function join(ref: TableRef, mode: JoinMode, oldDev: string | null, now: Date = new Date()): Promise<JoinResult> {
  const settings = await getTTSettings();
  if (!settings[ref.store].on) throw new TTError("이 가게는 지금 테이블톡을 쓰지 않습니다.", 403, "off");
  const day = serviceDay(now);
  const first = oldDev ? await loadDev(oldDev) : null;

  const picked = ref.via === "pick";
  return tx(async (q) => {
    // 이 매장(과, 다른 매장 테이블에서 옮겨 오는 폰이면 그 매장)을 잠근 뒤 폰을 다시 읽는다
    await lockStores(q, ref.store, ...(first ? [first.store] : []));
    const old = first ? await loadDev(first.dev, q) : null;
    if (await isLocked(q, ref.store, ref.table, day)) throw new TTError("이 테이블은 오늘 테이블톡이 막혀 있습니다. 직원에게 말씀해 주세요.", 403, "locked");

    // 이미 이 테이블 자리에 들어와 있는 폰이면 그대로. 허락을 기다리던 폰이 [방금 앉았습니다]를 고른 경우만 아래로 간다
    if (old && old.store === ref.store && old.table === ref.table && liveNow(old, now)) {
      if (old.status === "in") return { dev: old.dev, status: "in" as const };
      if (old.status === "wait" && mode !== "fresh") return { dev: old.dev, status: "wait" as const };
    }

    let seat = await liveSeatAt(q, ref.store, ref.table, day, true);
    let status: "in" | "wait" = "in";
    let opened = false;

    if (seat && mode === "fresh") {
      const quietFor = picked ? PICK_QUIET_FOR_NEW_MS : QUIET_FOR_NEW_MS;
      if (now.getTime() - asDate(seat.seen_at).getTime() < quietFor) {
        throw new TTError(
          `이 테이블의 이전 대화를 ${quietFor / 60_000}분 안에 본 폰이 있어 아직 새로 시작할 수 없습니다. 같은 일행이면 [일행으로 들어가기], 아니면 직원에게 비워 달라고 말씀해 주세요.`,
          409,
          "busy",
        );
      }
      await endSeats(q, [seat.id], "new");
      seat = null;
    } else if (seat) {
      const young = !picked && now.getTime() - asDate(seat.started_at).getTime() < FRESH_JOIN_MS;
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
      opened = !!made[0];
      // 번호로 온 폰이 남이 막 연 자리에 붙게 됐으면 허락을 받는다
      status = opened || !picked ? "in" : "wait";
    }

    const dev = await q.query<{ id: string }>(`insert into tt_devs (seat_id, status) values ($1, $2) returning id`, [seat.id, status]);
    if (status === "in") await q.query(`update tt_seats set seen_at=now() where id=$1`, [seat.id]);
    // 새 자리면 번호판의 칸이 켜진다(매장 전부). 있던 자리에 붙었으면 그 자리만(폰 수·허락 대기)
    if (opened) await bumpStore(q, ref.store);
    else await bumpSeats(q, [seat.id]);

    // 다른 테이블에 들어가 있던 폰이면 거기서는 나간다. 그 자리에 남은 폰이 없으면 그 자리도 끝낸다
    if (old && (old.status === "in" || old.status === "wait") && old.seat !== seat.id) {
      await q.query(
        `update tt_devs set status = case when status='wait' then 'no' else 'out' end, out_reason='self', decided_at=now() where id=$1 and status in ('in','wait')`,
        [old.dev],
      );
      const left = old.status === "in" && liveNow(old, now) ? await q.query(`select 1 from tt_devs where seat_id=$1 and status='in' limit 1`, [old.seat]) : [{}];
      if (left.length === 0) await endSeats(q, [old.seat], "team");
      else await bumpSeats(q, [old.seat]);
    }
    return { dev: dev[0]!.id, status };
  });
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
          // 번호로 온 폰은 5분 안이어도 허락을 받는다(join 과 같은 규칙)
          fresh: ref.via !== "pick" && now.getTime() - asDate(seat.started_at).getTime() < FRESH_JOIN_MS,
          quiet: now.getTime() - asDate(seat.seen_at).getTime() >= (ref.via === "pick" ? PICK_QUIET_FOR_NEW_MS : QUIET_FOR_NEW_MS),
        }
      : null,
    elsewhere: c && !why ? { storeName: getStore(c.store)?.shortName ?? "", table: c.table } : null,
    why: c && c.store === ref.store && c.table === ref.table ? why : null,
  };
}

/** 이 폰이 지금 들어와 있는 테이블(사이트 [테이블톡] 탭의 '이어서 대화하기') */
export async function currentTable(dev: string | null, now: Date = new Date()): Promise<{ store: StoreId; table: number } | null> {
  const c = dev ? await loadDev(dev) : null;
  if (!c || outWhy(c, now) || c.status !== "in") return null;
  return { store: c.store, table: c.table };
}

/** 번호 고르는 화면 — 지금 켜진 테이블·오늘 막은 테이블 */
export async function storeTables(store: StoreId, now: Date = new Date()): Promise<{ live: number[]; locked: number[] }> {
  const day = serviceDay(now);
  const [live, locked] = await Promise.all([
    // 3시간 아무도 안 본 자리는 정리만 안 됐을 뿐 끝난 자리다 — 켜짐으로 보이지 않게(정리 규칙과 같은 기준)
    query<{ table_no: number }>(
      `select table_no from tt_seats where store_id=$1 and status='on' and day=$2::date and seen_at > now() - interval '${IDLE_END}'`,
      [store, day],
    ),
    query<{ table_no: number }>(`select table_no from tt_locks where store_id=$1 and day=$2::date`, [store, day]),
  ]);
  return { live: live.map((r) => Number(r.table_no)), locked: locked.map((r) => Number(r.table_no)) };
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
  // 사장님이 테이블톡을 끄면 들어와 있던 폰도 닫힌다(설정은 30초 기억)
  if (!(await getTTSettings())[c.store].on) return { kind: "out", why: "off" };
  await touch(c);
  // 바뀐 게 없으면 폰 한 줄 읽고 끝난다(변경 번호·정리할 때가 같이 온다). 정리는 1분에 한 번
  let cur: DevCtx = c;
  if (c.due && (await maybeSweep(c.store, now))) {
    // 정리하다 이 자리가 끝났을 수 있다
    const again = await loadDev(c.dev);
    const why2 = outWhy(again, now);
    if (why2 || !again) return { kind: "out", why: why2 ?? "none" };
    cur = again;
  }
  const storeName = getStore(c.store)?.shortName ?? "";
  if (cur.status === "wait") return { kind: "waiting", store: c.store, storeName, table: c.table, since: iso(cur.startedAt) };
  if (clientV === cur.v) return { kind: "same", v: cur.v };
  return { kind: "state", state: await buildState(cur, after, now) };
}

async function buildState(c: DevCtx, after: number, now: Date): Promise<TTState> {
  const day = serviceDay(now);
  const settings = await getTTSettings();
  const me = c.seat;

  // 글은 방 목록과 같은 한 문장으로 고른다 — 방 목록을 따로 읽은 뒤 그사이 열린 방의 앞 번호 글을 커서가 건너뛰지 않게.
  // 처음(after=0)이면 최근 600줄, 아니면 after 뒤로 600줄. 하룻밤 대화가 600줄을 넘을 일은 드물다
  const cursor = Math.max(0, Math.floor(after));
  const myRooms = `select r.id from tt_rooms r where (r.seat_a = $1 or r.seat_b = $1) and (r.status = 'open' or r.closed_at > now() - interval '${ROOM_SHOW}')`;
  const [seats, asks, declined, rooms, blocks, joins, locks, phones, msgRows] = await Promise.all([
    query<{ id: string; table_no: number }>(`select id, table_no from tt_seats where store_id=$1 and status='on' and day=$2::date`, [c.store, day]),
    query<{ id: string; from_seat: string; to_seat: string; note: string | null; created_at: unknown }>(
      `select id, from_seat, to_seat, note, created_at from tt_asks where status='wait' and (from_seat=$1 or to_seat=$1) order by created_at`,
      [me],
    ),
    query<{ to_seat: string }>(`select to_seat from tt_asks where from_seat=$1 and status in ('no','cancel') and decided_at > now() - interval '${COOLDOWN}'`, [me]),
    query<{ id: string; status: string; created_at: unknown; closed_at: unknown; close_reason: string | null; closed_by: string | null; other: string; other_table: number; last: string | number }>(
      `select r.id, r.status, r.created_at, r.closed_at, r.close_reason, r.closed_by,
              case when r.seat_a = $1 then r.seat_b else r.seat_a end as other, o.table_no as other_table,
              coalesce((select max(m.id) from tt_msgs m where m.room_id = r.id), 0) as last
       from tt_rooms r join tt_seats o on o.id = (case when r.seat_a = $1 then r.seat_b else r.seat_a end)
       where (r.seat_a = $1 or r.seat_b = $1) and (r.status = 'open' or r.closed_at > now() - interval '${ROOM_SHOW}')
       order by r.created_at`,
      [me],
    ),
    // 우리가 막은 테이블 + 우리 테이블 번호를 막은 (지금 열린) 자리
    query<{ seat_id: string; other_seat: string; other_table: number | null }>(
      `select b.seat_id, b.other_seat, b.other_table from tt_blocks b join tt_seats bs on bs.id = b.seat_id
       where bs.store_id=$2 and bs.status='on' and bs.day=$3::date and (b.seat_id=$1 or b.other_table=$4 or b.other_seat=$1) and ${BLOCK_LIVE}`,
      [me, c.store, day, c.table],
    ),
    query<{ id: string; created_at: unknown }>(`select id, created_at from tt_devs where seat_id=$1 and status='wait' and created_at > now() - interval '${JOIN_TTL}' order by created_at`, [me]),
    query<{ table_no: number }>(`select table_no from tt_locks where store_id=$1 and day=$2::date`, [c.store, day]),
    one<{ n: number }>(`select count(*)::int as n from tt_devs where seat_id=$1 and status='in'`, [me]),
    query<{ id: string | number; room_id: string; seat_id: string | null; kind: string | null; body: string; nonce: string | null; created_at: unknown }>(
      cursor === 0
        ? `select * from (select id, room_id, seat_id, kind, body, nonce, created_at from tt_msgs where room_id in (${myRooms}) order by id desc limit 600) t order by id`
        : `select id, room_id, seat_id, kind, body, nonce, created_at from tt_msgs where room_id in (${myRooms}) and id > $2 order by id limit 600`,
      cursor === 0 ? [me] : [me, cursor],
    ),
  ]);

  const tableOfSeat = new Map(seats.map((s) => [s.id, Number(s.table_no)]));
  const seatOfTable = new Map(seats.map((s) => [Number(s.table_no), s.id]));

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
  const blocked = new Set<number>();
  for (const b of blocks) {
    if (b.seat_id === me) {
      const t = b.other_table ?? tableOfSeat.get(b.other_seat);
      if (t != null) blocked.add(Number(t));
    } else {
      const t = tableOfSeat.get(b.seat_id);
      if (t != null) blocked.add(t);
    }
  }
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
    else if (blocked.has(no)) tiles.push({ no, state: "off" });
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
    v: c.v,
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

/** 둘 중 한쪽이 상대 테이블을 막았나. 막은 쪽은 자리, 막힌 쪽은 테이블 번호로 본다 — 막힌 쪽이 자리를 떠났다 다시 찍어도 막혀 있다 */
async function blockedEither(q: Queryable, me: DevCtx, target: SeatRow): Promise<boolean> {
  const r = await q.query(
    `select 1 from tt_blocks b join tt_seats bs on bs.id = b.seat_id
     where ((b.seat_id=$1 and (b.other_table=$2 or b.other_seat=$3)) or (b.seat_id=$3 and (b.other_table=$4 or b.other_seat=$1))) and ${BLOCK_LIVE} limit 1`,
    [me.seat, Number(target.table_no), target.id, me.table],
  );
  return r.length > 0;
}

export async function ask(dev: string | null, toTable: number, noteRaw: unknown, now: Date = new Date()): Promise<void> {
  const c0 = await requireIn(dev, now);
  if (!Number.isInteger(toTable) || toTable < 1) throw new TTError("테이블 번호가 맞지 않습니다.");
  if (toTable === c0.table) throw new TTError("우리 테이블입니다.");
  const note = cleanNote(noteRaw) || null;
  if (!(await rateLimit(`tt-ask:${c0.seat}`, 12, 3600))) throw new TTError("말 걸기를 너무 많이 했습니다. 잠시 뒤에 다시 해 주세요.", 429, "rate");
  const day = serviceDay(now);
  await tx(async (q) => {
    const c = await enter(q, c0, now);
    if (await isLocked(q, c.store, toTable, day)) throw new TTError("지금은 그 테이블에 말을 걸 수 없습니다.", 409, "off");
    const target = await liveSeatAt(q, c.store, toTable, day);
    if (!target) throw new TTError(`${toTable}번 테이블은 지금 테이블톡을 쓰지 않습니다.`, 409, "empty");
    if (await blockedEither(q, c, target)) throw new TTError("지금은 그 테이블에 말을 걸 수 없습니다.", 409, "off");
    const open = await q.query(`select 1 from tt_rooms where status='open' and least(seat_a, seat_b) = least($1::uuid, $2::uuid) and greatest(seat_a, seat_b) = greatest($1::uuid, $2::uuid)`, [c.seat, target.id]);
    if (open.length) return;

    // 상대가 이미 우리에게 신청해 둔 상태면 서로 원한 것 — 바로 방을 연다
    const reverse = await q.query<{ id: string }>(`select id from tt_asks where from_seat=$1 and to_seat=$2 and status='wait' for update`, [target.id, c.seat]);
    if (reverse[0]) {
      await assertRoomRoom(q, c.seat, target.id);
      await openRoom(q, c.store, target.id, c.seat);
      await q.query(`update tt_asks set status='ok', decided_at=now() where id=$1`, [reverse[0].id]);
      await bumpSeats(q, [c.seat, target.id]);
      return;
    }

    const cool = await q.query(
      `select 1 from tt_asks where from_seat=$1 and to_seat=$2 and status in ('no','cancel') and decided_at > now() - interval '${COOLDOWN}'
       union all
       select 1 from tt_rooms where status='closed' and closed_at > now() - interval '${COOLDOWN}'
         and least(seat_a, seat_b) = least($1::uuid, $2::uuid) and greatest(seat_a, seat_b) = greatest($1::uuid, $2::uuid)
       limit 1`,
      [c.seat, target.id],
    );
    if (cool.length) throw new TTError("이 테이블에는 15분 뒤에 다시 말을 걸 수 있습니다.", 409, "wait");
    const pend = await q.query<{ n: number }>(`select count(*)::int as n from tt_asks where from_seat=$1 and status='wait'`, [c.seat]);
    if ((pend[0]?.n ?? 0) >= MAX_SENT) throw new TTError(`답을 기다리는 신청이 ${MAX_SENT}개입니다. 답이 오거나 취소한 뒤에 거세요.`, 409, "many");
    if ((await openRoomCount(q, c.seat)) >= MAX_OPEN_ROOMS) throw new TTError(`대화방은 ${MAX_OPEN_ROOMS}개까지 열 수 있습니다.`, 409, "rooms");
    const made = await q.query(`insert into tt_asks (store_id, from_seat, to_seat, note) values ($1, $2, $3, $4) on conflict do nothing returning id`, [c.store, c.seat, target.id, note]);
    if (made.length) await bumpSeats(q, [c.seat, target.id]);
  });
}

async function assertRoomRoom(q: Queryable, a: string, b: string): Promise<void> {
  if ((await openRoomCount(q, a)) >= MAX_OPEN_ROOMS || (await openRoomCount(q, b)) >= MAX_OPEN_ROOMS) {
    throw new TTError(`대화방은 ${MAX_OPEN_ROOMS}개까지 열 수 있습니다. 끝난 대화를 나간 뒤에 해 주세요.`, 409, "rooms");
  }
}

/** 받은 신청에 답하기. 일행 폰이 먼저 답했으면 아무 일도 하지 않는다 */
export async function answer(dev: string | null, askId: unknown, ok: boolean, now: Date = new Date()): Promise<void> {
  const c0 = await requireIn(dev, now);
  if (typeof askId !== "string" || !/^[0-9a-f-]{36}$/i.test(askId)) throw new TTError("신청을 찾을 수 없습니다.", 404);
  const gone = await tx(async (q) => {
    const c = await enter(q, c0, now);
    const rows = await q.query<{ id: string; from_seat: string; to_seat: string; status: string }>(`select id, from_seat, to_seat, status from tt_asks where id=$1 for update`, [askId]);
    const a = rows[0];
    if (!a || a.to_seat !== c.seat) throw new TTError("신청을 찾을 수 없습니다.", 404);
    if (a.status !== "wait") return false;
    if (!ok) {
      await q.query(`update tt_asks set status='no', decided_at=now() where id=$1`, [a.id]);
      await bumpSeats(q, [a.from_seat, c.seat]);
      return false;
    }
    const from = await q.query(`select 1 from tt_seats where id=$1 and status='on' and day=$2::date`, [a.from_seat, serviceDay(now)]);
    if (!from.length) {
      await q.query(`update tt_asks set status='gone', decided_at=now() where id=$1`, [a.id]);
      await bumpSeats(q, [a.from_seat, c.seat]);
      return true;
    }
    await assertRoomRoom(q, a.from_seat, c.seat);
    await openRoom(q, c.store, a.from_seat, c.seat);
    await q.query(`update tt_asks set status='ok', decided_at=now() where id=$1 or (from_seat=$2 and to_seat=$3 and status='wait')`, [a.id, c.seat, a.from_seat]);
    await bumpSeats(q, [a.from_seat, c.seat]);
    return false;
  });
  // 거둔 신청을 저장한 뒤에 알린다 — 트랜잭션 안에서 던지면 거둔 것까지 되돌아가 신청이 계속 남는다
  if (gone) throw new TTError("그 테이블이 자리를 떠났습니다.", 409, "gone");
}

export async function cancelAsk(dev: string | null, askId: unknown, now: Date = new Date()): Promise<void> {
  const c0 = await requireIn(dev, now);
  if (typeof askId !== "string" || !/^[0-9a-f-]{36}$/i.test(askId)) return;
  await tx(async (q) => {
    const c = await enter(q, c0, now);
    const r = await q.query<{ to_seat: string }>(`update tt_asks set status='cancel', decided_at=now() where id=$1 and from_seat=$2 and status='wait' returning to_seat`, [askId, c.seat]);
    if (r[0]) await bumpSeats(q, [c.seat, r[0].to_seat]);
  });
}

/** 받은 신청을 차단·신고로 닫는다 — 대화방이 열리기 전에도 막을 수 있게. 신고면 첫 마디를 직원에게 남긴다. 상대에게는 신청이 사라진 것으로만 보인다 */
export async function refuseAsk(dev: string | null, askId: unknown, how: "block" | "report", now: Date = new Date()): Promise<void> {
  const c0 = await requireIn(dev, now);
  if (typeof askId !== "string" || !/^[0-9a-f-]{36}$/i.test(askId)) throw new TTError("신청을 찾을 수 없습니다.", 404);
  await tx(async (q) => {
    const c = await enter(q, c0, now);
    const rows = await q.query<{ from_seat: string; to_seat: string; note: string | null; created_at: unknown; from_table: number }>(
      `select a.from_seat, a.to_seat, a.note, a.created_at, s.table_no as from_table from tt_asks a join tt_seats s on s.id = a.from_seat where a.id=$1`,
      [askId],
    );
    const a = rows[0];
    if (!a || a.to_seat !== c.seat) throw new TTError("신청을 찾을 수 없습니다.", 404);
    const fromNo = Number(a.from_table);
    await q.query(
      `insert into tt_blocks (seat_id, other_seat, other_table) values ($1, $2, $3) on conflict (seat_id, other_seat) do update set other_table = excluded.other_table`,
      [c.seat, a.from_seat, fromNo],
    );
    await q.query(`update tt_asks set status='no', decided_at=now() where status='wait' and ((from_seat=$1 and to_seat=$2) or (from_seat=$2 and to_seat=$1))`, [a.from_seat, c.seat]);
    // 그사이 일행 폰이 수락해 방이 열렸어도 막는다 — 막힌 두 테이블 사이에 열린 방이 남지 않게
    const shut = await q.query<{ id: string }>(
      `update tt_rooms set status='closed', closed_at=now(), closed_by=$1, close_reason=$3
       where status='open' and least(seat_a, seat_b) = least($1::uuid, $2::uuid) and greatest(seat_a, seat_b) = greatest($1::uuid, $2::uuid) returning id`,
      [c.seat, a.from_seat, how === "report" ? "reported" : "blocked"],
    );
    for (const r of shut) await q.query(`insert into tt_msgs (room_id, kind, body) values ($1, 'end', '')`, [r.id]);
    if (how === "report") {
      const lines = a.note ? [{ at: iso(a.created_at), table: fromNo, body: a.note }] : [];
      await q.query(
        `insert into tt_reports (store_id, day, by_table, on_table, on_seat, lines) values ($1, $2::date, $3, $4, $5, $6::jsonb)`,
        [c.store, serviceDay(now), c.table, fromNo, a.from_seat, JSON.stringify(lines)],
      );
    }
    await bumpSeats(q, [c.seat, a.from_seat]);
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
  const c0 = await requireIn(dev, now);
  const body = cleanMessage(bodyRaw);
  if (!body) throw new TTError("보낼 글이 없습니다.");
  if (!(await rateLimit(`tt-msg:${c0.dev}`, 10, 15))) throw new TTError("너무 빨리 보내고 있습니다. 잠깐 쉬었다 보내 주세요.", 429, "rate");
  if (!(await rateLimit(`tt-msg-seat:${c0.seat}`, 60, 60))) throw new TTError("너무 빨리 보내고 있습니다. 잠깐 쉬었다 보내 주세요.", 429, "rate");
  await tx(async (q) => {
    const c = await enter(q, c0, now);
    const room = await myRoom(q, c, roomId);
    if (room.status !== "open") throw new TTError("대화가 끝났습니다.", 409, "closed");
    const r = await q.query<{ id: string }>(
      `insert into tt_msgs (room_id, seat_id, dev, body, nonce) values ($1, $2, $3, $4, $5)
       on conflict (room_id, nonce) where nonce is not null do nothing returning id`,
      [room.id, c.seat, c.dev, body, nonce],
    );
    if (r.length) await bumpSeats(q, [c.seat, room.other]);
  });
}

/** 대화방 닫기 — 나가기(left) · 차단(end) · 신고(end, 직원에게 남김) */
export async function closeRoom(dev: string | null, roomId: unknown, how: "leave" | "block" | "report", now: Date = new Date()): Promise<void> {
  const c0 = await requireIn(dev, now);
  await tx(async (q) => {
    const c = await enter(q, c0, now);
    const room = await myRoom(q, c, roomId);
    const other = await q.query<{ table_no: number }>(`select table_no from tt_seats where id=$1`, [room.other]);
    const otherNo = Number(other[0]?.table_no ?? 0);
    if (how === "report") {
      const lines = await q.query<{ seat_id: string | null; kind: string | null; body: string; created_at: unknown }>(
        `select seat_id, kind, body, created_at from tt_msgs where room_id=$1 order by id desc limit 40`,
        [room.id],
      );
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
      await q.query(
        `insert into tt_blocks (seat_id, other_seat, other_table) values ($1, $2, $3) on conflict (seat_id, other_seat) do update set other_table = excluded.other_table`,
        [c.seat, room.other, otherNo || null],
      );
      await q.query(`update tt_asks set status='gone', decided_at=now() where status='wait' and ((from_seat=$1 and to_seat=$2) or (from_seat=$2 and to_seat=$1))`, [c.seat, room.other]);
    }
    if (room.status === "open") {
      const reason = how === "leave" ? "left" : how === "block" ? "blocked" : "reported";
      const shut = await q.query(`update tt_rooms set status='closed', closed_at=now(), closed_by=$2, close_reason=$3 where id=$1 and status='open' returning id`, [room.id, c.seat, reason]);
      if (shut.length) await q.query(`insert into tt_msgs (room_id, kind, body) values ($1, $2, $3)`, [room.id, how === "leave" ? "left" : "end", how === "leave" ? String(c.table) : ""]);
    }
    await bumpSeats(q, [c.seat, room.other]);
  });
}

/* ───────── 우리 테이블 ───────── */

/** 허락 기다리는 새 폰 받기/거절 */
export async function admit(dev: string | null, joinDev: unknown, ok: boolean, now: Date = new Date()): Promise<void> {
  const c0 = await requireIn(dev, now);
  if (typeof joinDev !== "string" || !/^[0-9a-f-]{36}$/i.test(joinDev)) throw new TTError("요청을 찾을 수 없습니다.", 404);
  await tx(async (q) => {
    const c = await enter(q, c0, now);
    const r = await q.query(
      `update tt_devs set status=$3, out_reason = case when $3='no' then 'denied' else null end, decided_at=now(), seen_at=now()
       where id=$1 and seat_id=$2 and status='wait' returning id`,
      [joinDev, c.seat, ok ? "in" : "no"],
    );
    if (r.length) await bumpSeats(q, [c.seat]);
  });
}

/** 이 폰만 나가기 — 마지막 폰이면 자리도 끝난다 */
export async function leaveDevice(dev: string | null, now: Date = new Date()): Promise<void> {
  const first = dev ? await loadDev(dev) : null;
  if (!first) return;
  await tx(async (q) => {
    await lockStores(q, first.store);
    // 잠근 뒤의 모습으로 — 마지막 두 폰이 같이 나가도 둘째가 첫째를 보고 자리를 끝낸다
    const c = await loadDev(first.dev, q);
    if (!c) return;
    const r = await q.query(`update tt_devs set status = case when status='wait' then 'no' else 'out' end, out_reason='self', decided_at=now() where id=$1 and status in ('in','wait') returning id`, [c.dev]);
    if (!r.length) return;
    if (c.status === "in" && liveNow(c, now)) {
      const left = await q.query(`select 1 from tt_devs where seat_id=$1 and status='in' limit 1`, [c.seat]);
      if (left.length === 0) {
        await endSeats(q, [c.seat], "team");
        return;
      }
    }
    await bumpSeats(q, [c.seat]);
  });
}

/** 자리 떠나기 — 우리 테이블 폰 모두 나가고 대화방도 모두 닫힌다. 이미 끝난 자리면 할 일이 없다 */
export async function endTeam(dev: string | null, now: Date = new Date()): Promise<void> {
  const first = dev ? await loadDev(dev) : null;
  if (!first || outWhy(first, now) || first.status !== "in") return;
  await tx(async (q) => {
    await lockStores(q, first.store);
    const c = await loadDev(first.dev, q);
    if (!c || outWhy(c, now) || c.status !== "in") return;
    await endSeats(q, [c.seat], "team");
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
    await lockStores(q, store);
    const seat = await liveSeatAt(q, store, table, day, true);
    if (!seat) return false;
    await endSeats(q, [seat.id], "staff");
    return true;
  });
}

/** 오늘 이 테이블 막기/풀기. 막으면 열린 자리도 비운다 */
export async function adminLock(store: StoreId, table: number, on: boolean, adminId: string, now: Date = new Date()): Promise<void> {
  const day = serviceDay(now);
  await tx(async (q) => {
    // 손님 폰의 입장과 한 줄로 — 막는 순간 들어오던 폰이 막힌 테이블에 자리를 열지 못한다
    await lockStores(q, store);
    if (on) {
      await q.query(`insert into tt_locks (store_id, table_no, day, by_admin) values ($1, $2, $3::date, $4) on conflict do nothing`, [store, table, day, adminId]);
      const seat = await liveSeatAt(q, store, table, day, true);
      if (seat) await endSeats(q, [seat.id], "staff");
    } else {
      await q.query(`delete from tt_locks where store_id=$1 and table_no=$2 and day=$3::date`, [store, table, day]);
    }
    await bumpStore(q, store);
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
