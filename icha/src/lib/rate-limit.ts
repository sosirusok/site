import { query } from "./db";

/**
 * 고정 윈도우 속도 제한 (서버리스에서도 동작하도록 DB 기반).
 * 허용되면 true, 초과하면 false.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const rows = await query<{ count: number }>(
    `insert into rate_limits (key, count, window_start) values ($1, 1, now())
     on conflict (key) do update set
       count = case when rate_limits.window_start < now() - ($2::int * interval '1 second') then 1 else rate_limits.count + 1 end,
       window_start = case when rate_limits.window_start < now() - ($2::int * interval '1 second') then now() else rate_limits.window_start end
     returning count`,
    [key, windowSec],
  );
  return (rows[0]?.count ?? 0) <= limit;
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0"
  );
}
