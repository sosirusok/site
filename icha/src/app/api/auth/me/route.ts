import { NextResponse, type NextRequest } from "next/server";
import { MEMBER_HINT_COOKIE, getMemberSession, memberHintOpts } from "@/lib/auth/session";

/**
 * "지금 누구?" — 손님 화면(홈·매장·안내·로그인)은 정적 HTML 이라 세션을 못 읽는다. 헤더가 마운트된 뒤 여기로 물어 내 번호 꼬리표를 그린다.
 * 회원 쿠키(HttpOnly)를 검증해 { phone } 또는 { phone: null }. 개인 정보라 브라우저·CDN 어디에도 남기지 않는다.
 * 로그인 표시 쿠키(icha_m)도 여기서 맞춘다 — 표시가 생기기 전에 로그인한 폰은 채우고, 로그인이 풀린 폰은 지운다.
 */
export async function GET(req: NextRequest) {
  const s = await getMemberSession();
  const res = NextResponse.json({ phone: s?.phone ?? null }, { headers: { "Cache-Control": "private, no-store" } });
  const hinted = req.cookies.get(MEMBER_HINT_COOKIE)?.value === "1";
  if (s && !hinted) res.cookies.set(MEMBER_HINT_COOKIE, "1", memberHintOpts());
  if (!s && req.cookies.has(MEMBER_HINT_COOKIE)) res.cookies.delete(MEMBER_HINT_COOKIE);
  return res;
}
