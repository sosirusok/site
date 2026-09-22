/**
 * 진행 중인 본인확인 건을 이 브라우저에 묶어 둔다.
 *
 * identityVerificationId 는 주소창에 그대로 노출된다(모바일 redirect 방식). 그래서 브라우저가 보내 온 id 를
 * 그대로 믿으면, 남이 방금 인증한 id 를 주워서 붙여 넣는 것만으로 남의 인증을 가로챌 수 있다.
 * 발급할 때 서명된 짧은 쿠키에 id 를 적어 두고, 돌아왔을 때 그 쿠키와 같은 id 인지 본다.
 */
import { cookies } from "next/headers";
import { signShortToken, verifyToken } from "@/lib/auth/token";

export const PENDING_COOKIE = "icha_iv";
const PENDING_MINUTES = 15;

export type PendingIdentity = {
  /** 우리가 만든 본인인증 건 ID */
  ivId: string;
  /** 인증이 끝나면 돌아갈 사이트 안 경로 */
  next: string;
  /** 이미 로그인한 회원이 성인 확인만 받는 경우 그 회원 id */
  memberId?: string;
};

export async function setPending(p: PendingIdentity): Promise<void> {
  const jar = await cookies();
  jar.set(PENDING_COOKIE, await signShortToken({ ...p, kind: "iv" }, PENDING_MINUTES), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_MINUTES * 60,
  });
}

export async function readPending(): Promise<PendingIdentity | null> {
  const jar = await cookies();
  const p = await verifyToken<PendingIdentity & { kind?: string }>(jar.get(PENDING_COOKIE)?.value);
  if (!p || p.kind !== "iv" || typeof p.ivId !== "string") return null;
  return { ivId: p.ivId, next: typeof p.next === "string" ? p.next : "/wallet", memberId: typeof p.memberId === "string" ? p.memberId : undefined };
}

export async function clearPending(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
}

/**
 * 번호는 아직 모르지만 성인임은 확인된 상태 — 다날처럼 전화번호를 주지 않는 계약일 때 쓴다.
 * 이 쿠키가 있는 동안 번호를 넣어 로그인하면 그 번호의 회원에 성인 확인이 새겨진다.
 */
export const ADULT_COOKIE = "icha_adult";
const ADULT_MINUTES = 20;

export type AdultTicket = { identityKey: string | null };

export async function setAdultTicket(t: AdultTicket): Promise<void> {
  const jar = await cookies();
  jar.set(ADULT_COOKIE, await signShortToken({ ...t, kind: "adult" }, ADULT_MINUTES), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADULT_MINUTES * 60,
  });
}

export async function readAdultTicket(): Promise<AdultTicket | null> {
  const jar = await cookies();
  const t = await verifyToken<AdultTicket & { kind?: string }>(jar.get(ADULT_COOKIE)?.value);
  return t && t.kind === "adult" ? { identityKey: typeof t.identityKey === "string" ? t.identityKey : null } : null;
}

export async function clearAdultTicket(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADULT_COOKIE);
}
