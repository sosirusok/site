import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 공용 QR 입구 — QR을 스캔하면 서비스 홈페이지를 표시한다.
 * 외부 사이트에는 별도 요청을 보내지 않는다.
 */
export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 302);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
