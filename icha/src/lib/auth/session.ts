/**
 * 세션 — 회원(전화번호)과 관리자 두 종류. jose HS256 JWT를 HttpOnly 쿠키에 담는다.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const MEMBER_COOKIE = "icha_member";
const ADMIN_COOKIE = "icha_admin";
const MEMBER_DAYS = 180;
const ADMIN_DAYS = 14;

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET 환경변수를 설정하세요 (32자 이상).");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-please");
  }
  return new TextEncoder().encode(s);
}

export type MemberSession = { memberId: string; phone: string };
export type AdminSession = { adminId: string; name: string; role: "owner" | "staff"; storeId: string | null };

async function sign(payload: Record<string, unknown>, days: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret());
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

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
  const s = await verify<MemberSession & { kind?: string }>(jar.get(MEMBER_COOKIE)?.value);
  return s && s.kind === "member" ? { memberId: s.memberId, phone: s.phone } : null;
}

export async function setMemberSession(s: MemberSession): Promise<void> {
  const jar = await cookies();
  jar.set(MEMBER_COOKIE, await sign({ ...s, kind: "member" }, MEMBER_DAYS), cookieOpts(MEMBER_DAYS));
}

export async function clearMemberSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const s = await verify<AdminSession & { kind?: string }>(jar.get(ADMIN_COOKIE)?.value);
  return s && s.kind === "admin"
    ? { adminId: s.adminId, name: s.name, role: s.role, storeId: s.storeId ?? null }
    : null;
}

export async function setAdminSession(s: AdminSession): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await sign({ ...s, kind: "admin" }, ADMIN_DAYS), cookieOpts(ADMIN_DAYS));
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
