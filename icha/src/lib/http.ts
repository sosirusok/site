import { NextResponse } from "next/server";

export { isUuid } from "./db/queries";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}): NextResponse {
  return json({ ok: false, error: message, ...extra }, status);
}

export function errorResponse(e: unknown): NextResponse {
  const status = typeof (e as { status?: unknown })?.status === "number" ? (e as { status: number }).status : 500;
  const message = e instanceof Error ? e.message : "알 수 없는 오류";
  if (status >= 500) console.error(e);
  return fail(status >= 500 ? "서버 오류가 났습니다. 잠시 후 다시 시도해 주세요." : message, status);
}
