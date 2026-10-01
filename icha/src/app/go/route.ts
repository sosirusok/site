import { NextResponse } from "next/server";
import { QR_SCAN_PARAM } from "@/lib/qr-traffic";

export const dynamic = "force-dynamic";

/**
 * 공용 QR 입구 — 스캔마다 새 토큰을 붙여 서비스 홈페이지로 이동한다.
 * 홈페이지는 이 토큰 하나당 참여 매장 세 곳에 한 번씩 트래픽을 보낸다.
 */
export function GET(request: Request) {
  const target = new URL("/", request.url);
  target.hash = `${QR_SCAN_PARAM}=${crypto.randomUUID()}`;

  const response = NextResponse.redirect(target, 302);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
