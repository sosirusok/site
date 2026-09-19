/**
 * 세션 — 회원(전화번호)과 관리자 두 종류. jose HS256 JWT를 HttpOnly 쿠키에 담는다.
 * 서명·검증 자체는 ./token.ts(순수 함수) — 여기서는 쿠키를 읽고 쓴다. cookies() 를 부르므로 이 함수를 쓰는 화면은 동적 렌더링이 된다:
 * 손님 화면(홈·매장·안내·로그인)은 정적(ISR)이라 세션을 읽지 않고, 헤더가 /api/auth/me 로 묻는다.
 */
import { cookies } from "next/headers";
import { signToken, verifyAdminToken, verifyMemberToken, type AdminSession, type MemberSession } from "./token";

export type { AdminSession, MemberSession } from "./token";

export const MEMBER_COOKIE = "icha_member";
export const ADMIN_COOKIE = "icha_admin";
const MEMBER_DAYS = 180;
const ADMIN_DAYS = 14;

function cookieOpts(days: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  };
}

export async function getMemberSession(): Promise<MemberSession | null> {
  const jar = await cookies();
  return verifyMemberToken(jar.get(MEMBER_COOKIE)?.value);
}

export async function setMemberSession(s: MemberSession): Promise<void> {
  const jar = await cookies();
  jar.set(MEMBER_COOKIE, await signToken({ ...s, kind: "member" }, MEMBER_DAYS), cookieOpts(MEMBER_DAYS));
}

export async function clearMemberSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function setAdminSession(s: AdminSession): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await signToken({ ...s, kind: "admin" }, ADMIN_DAYS), cookieOpts(ADMIN_DAYS));
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
