/**
 * 테이블톡 호출 수 세기 + 지금의 속도(pace).
 * 호출마다 DB 에 쓰면 그것도 부하라, 인스턴스 안에서 모았다가 25번 또는 20초마다 한 번에 더한다.
 * 인스턴스가 사라지며 잃는 수는 많아야 24 — 예산을 정확히 맞추는 게 아니라 크게 넘지 않게 하는 용도라 충분하다.
 */
import { one, query } from "@/lib/db";
import { serviceDay } from "./code";
import { DEFAULT_BUDGET_30D, paceFor, type Pace } from "./pace";
import type { SyncOut } from "./service";
import type { Sync } from "./types";

let pending = 0;
let lastFlush = Date.now();
let read: { at: number; used30: number; today: number } | null = null;

export function budget(): number {
  const n = Number(process.env.TT_BUDGET);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_BUDGET_30D;
}

/** 요청 하나를 센다. 쌓였으면 DB 에 더한다 */
export async function countHit(now: Date = new Date()): Promise<void> {
  pending++;
  if (pending < 25 && Date.now() - lastFlush < 20_000) return;
  const n = pending;
  pending = 0;
  lastFlush = Date.now();
  try {
    await query(`insert into tt_usage (day, n) values ($1::date, $2) on conflict (day) do update set n = tt_usage.n + excluded.n`, [serviceDay(now), n]);
  } catch {
    pending += n;
  }
}

export async function usageNow(now: Date = new Date()): Promise<{ used30: number; today: number }> {
  if (read && Date.now() - read.at < 60_000) return { used30: read.used30 + pending, today: read.today + pending };
  const day = serviceDay(now);
  const since = serviceDay(new Date(now.getTime() - 29 * 86400 * 1000));
  const row = await one<{ used30: string | number | null; today: string | number | null }>(
    `select coalesce(sum(n), 0) as used30, coalesce(sum(n) filter (where day = $1::date), 0) as today from tt_usage where day >= $2::date`,
    [day, since],
  );
  read = { at: Date.now(), used30: Number(row?.used30 ?? 0), today: Number(row?.today ?? 0) };
  return { used30: read.used30 + pending, today: read.today + pending };
}

export async function currentPace(now: Date = new Date()): Promise<Pace> {
  try {
    const u = await usageNow(now);
    return paceFor(u.used30, u.today, budget());
  } catch {
    return { pace: 1, closed: false };
  }
}

/** 서버 결과에 지금 속도를 붙여 화면에 줄 모양으로 */
export async function withPace(s: SyncOut): Promise<Sync> {
  const p = await currentPace();
  if (s.kind === "state" || s.kind === "same") return { ...s, pace: p.pace, closed: p.closed };
  if (s.kind === "waiting") return { ...s, pace: p.pace };
  return s;
}
