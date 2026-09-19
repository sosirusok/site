import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/auth/session";

/**
 * "지금 누구?" — 손님 화면(홈·매장·안내·로그인)은 정적 HTML 이라 세션을 못 읽는다. 헤더가 마운트된 뒤 여기로 물어 내 번호 꼬리표를 그린다.
 * 회원 쿠키(HttpOnly)를 검증해 { phone } 또는 { phone: null }. 개인 정보라 브라우저·CDN 어디에도 남기지 않는다.
 */
export async function GET() {
  const s = await getMemberSession();
  return NextResponse.json({ phone: s?.phone ?? null }, { headers: { "Cache-Control": "private, no-store" } });
}
