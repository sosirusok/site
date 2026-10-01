/**
 * 테이블톡 쿠키 — 이 폰이 누구인지(tt_devs.id)만 담는다. 어느 테이블·자리인지는 DB 가 안다.
 * 영업일이 끝나는 시각(다음 한국 낮 12시)에 같이 끝난다. 로그인(icha_member)과는 아무 상관이 없다.
 */
import { cookies } from "next/headers";
import { signTokenHours, verifyToken } from "@/lib/auth/token";
import { serviceDayEndsAt } from "./code";

export const TT_COOKIE = "icha_tt";

export async function readDev(): Promise<string | null> {
  const jar = await cookies();
  const t = await verifyToken<{ kind?: string; dev?: string }>(jar.get(TT_COOKIE)?.value);
  return t && t.kind === "tt" && typeof t.dev === "string" ? t.dev : null;
}

export async function setDev(dev: string, now: Date = new Date()): Promise<void> {
  const seconds = Math.max(3600, Math.floor((serviceDayEndsAt(now).getTime() - now.getTime()) / 1000));
  const jar = await cookies();
  jar.set(TT_COOKIE, await signTokenHours({ kind: "tt", dev }, Math.ceil(seconds / 3600)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: seconds,
  });
}

export async function clearDev(): Promise<void> {
  const jar = await cookies();
  jar.delete(TT_COOKIE);
}
