import { purgeOldData } from "@/lib/db/queries";
import { purgeTableTalk } from "@/lib/tabletalk/service";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

/**
 * 보관 정리 — 하루 한 번(vercel.json crons). `Authorization: Bearer ${CRON_SECRET}` 가 맞아야 한다.
 * 반려 영수증 사진은 7일, 나머지 영수증 사진은 90일이 지나면 지운다(판정 기록은 남김). 오래된 속도 제한 행도 지운다.
 * 테이블톡 대화는 어제 영업일까지만 남기고(닫힌 뒤 이틀 안에) 지우고, 신고는 14일 지난 것을 지운다.
 * 로컬에서 직접 돌리려면: curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/purge
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return fail("CRON_SECRET 환경변수가 없어 정리 작업을 실행하지 않습니다.", 503);
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return fail("권한 없음", 401);
  const now = new Date();
  const result = await purgeOldData(now);
  const tabletalk = await purgeTableTalk(now);
  console.log("[cron/purge]", result, tabletalk);
  return json({ ok: true, ...result, tabletalk });
}
