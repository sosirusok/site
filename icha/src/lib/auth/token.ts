/**
 * 세션 토큰(jose HS256 JWT)의 서명·검증 — next/headers 를 끌어오지 않는 순수 함수.
 * 쿠키를 읽고 쓰는 쪽은 ./session.ts 이고, 요청 앞단(src/proxy.ts)은 쿠키 값만 받아 여기서 검증한다.
 */
import { SignJWT, jwtVerify } from "jose";

export type MemberSession = { memberId: string; phone: string };
export type AdminSession = { adminId: string; name: string; role: "owner" | "staff"; storeId: string | null };

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET 환경변수를 설정하세요 (32자 이상).");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-please");
  }
  return new TextEncoder().encode(s);
}

export async function signToken(payload: Record<string, unknown>, days: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret());
}

export async function verifyToken<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

/** 회원 쿠키 값 → 세션(kind 가 member 이고 서명이 맞을 때만) */
export async function verifyMemberToken(token: string | undefined): Promise<MemberSession | null> {
  const s = await verifyToken<MemberSession & { kind?: string }>(token);
  return s && s.kind === "member" ? { memberId: s.memberId, phone: s.phone } : null;
}

/** 관리자 쿠키 값 → 세션 */
export async function verifyAdminToken(token: string | undefined): Promise<AdminSession | null> {
  const s = await verifyToken<AdminSession & { kind?: string }>(token);
  return s && s.kind === "admin" ? { adminId: s.adminId, name: s.name, role: s.role, storeId: s.storeId ?? null } : null;
}
