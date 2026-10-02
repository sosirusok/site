/**
 * 세션 토큰(jose HS256 JWT)의 서명·검증 — next/headers 를 끌어오지 않는 순수 함수.
 * 쿠키를 읽고 쓰는 쪽은 ./session.ts 이고, 요청 앞단(src/proxy.ts)은 쿠키 값만 받아 여기서 검증한다.
 */
import { SignJWT, jwtVerify } from "jose";

export type MemberSession = { memberId: string; phone: string };
/** iat = 토큰을 만든 시각(초). 비밀번호를 바꾼 뒤의 옛 로그인을 가려내는 데 쓴다 */
export type AdminSession = { adminId: string; name: string; role: "owner" | "staff"; storeId: string | null; iat?: number };

/** 공개된 예시 값(.env.example·개발용) — 그대로 옮겨 적었으면 없는 것과 같다 */
const PLACEHOLDER_SECRETS = new Set(["change-me-to-a-long-random-string", "dev-only-insecure-secret-change-me-please"]);

/** 서명 키(SESSION_SECRET). 테이블 QR 서명처럼 같은 비밀로 HMAC 을 거는 곳에서도 쓴다 */
export function secret(): Uint8Array {
  // 값 자체는 손대지 않는다(앞뒤 공백까지 바꾸면 서명 키가 달라져 모든 로그인·인쇄한 QR 이 풀린다)
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16 || PLACEHOLDER_SECRETS.has(s.trim())) {
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

/** 시간 단위로 끝나는 토큰 — 테이블톡 쿠키처럼 하룻밤만 쓰는 것 */
export async function signTokenHours(payload: Record<string, unknown>, hours: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
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
  return s && s.kind === "admin" ? { adminId: s.adminId, name: s.name, role: s.role, storeId: s.storeId ?? null, iat: typeof s.iat === "number" ? s.iat : undefined } : null;
}
