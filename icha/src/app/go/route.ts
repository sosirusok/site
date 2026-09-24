import { NextResponse } from "next/server";
import { placeLinks } from "@/lib/naver";
import { STORE_BY_ID } from "@/lib/stores";

const QR_STORE_IDS = ["tokyo", "joseon", "wareureu"] as const;

const PLACE_URLS = QR_STORE_IDS.map((id) => placeLinks(STORE_BY_ID[id])?.home).filter(
  (url): url is string => Boolean(url),
);

export const dynamic = "force-dynamic";

/**
 * 공용 QR 입구 — 스캔마다 세 매장 중 한 곳의 네이버 플레이스로 바로 이동한다.
 * 한 요청은 한 매장만 열며, 응답을 캐시하지 않아 매번 새로 선택한다.
 */
export function GET() {
  if (PLACE_URLS.length === 0) {
    return new Response("등록된 네이버 플레이스가 없습니다.", { status: 503 });
  }

  const target = PLACE_URLS[Math.floor(Math.random() * PLACE_URLS.length)]!;
  const response = NextResponse.redirect(target, 302);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

