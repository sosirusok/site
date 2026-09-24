import { NextResponse } from "next/server";
import { placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";

/**
 * QR 입구 — /q/tokyo 처럼 찍으면 그 가게 네이버 플레이스가 먼저 열린다(손님이 플레이스를 실제로 보므로 방문으로 잡힌다).
 * 사이트로는 플레이스의 '홈페이지' 링크로 들어온다. 모르는 가게면 사이트 첫 화면.
 */
export async function GET(req: Request, { params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  const s = STORES.find((x) => x.id === store);
  const place = s ? placeLinks(s)?.home : null;
  return NextResponse.redirect(place ?? new URL("/", req.url), 302);
}
