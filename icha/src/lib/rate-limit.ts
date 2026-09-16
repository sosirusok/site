import { query } from "./db";

/**
 * 고정 윈도우 속도 제한 (서버리스에서도 동작하도록 DB 기반).
 * 허용되면 true, 초과하면 false.
 * 오래된 행은 기동 시(ensureSchema)와 /api/cron/purge 에서 지우고, 여기서도 1% 확률로 비동기 정리한다.
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
  if (Math.random() < 0.01) void query(`delete from rate_limits where window_start < now() - interval '1 day'`).catch(() => {});
  return (rows[0]?.count ?? 0) <= limit;
}

/**
 * 요청 IP. 신뢰할 수 있는 프록시(Vercel, nginx 등) 뒤에서만 의미가 있다.
 *  - Vercel: x-vercel-forwarded-for / x-real-ip 를 플랫폼이 덮어쓴다.
 *  - 자체 호스팅: 프록시가 x-real-ip 를 채우게 하고, x-forwarded-for 는 마지막 값(가장 가까운 프록시가 붙인 값)을 쓴다.
 * 헤더가 하나도 없으면 "0.0.0.0" 으로 묶어 제한한다.
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || xff[xff.length - 1] || "0.0.0.0";
}
