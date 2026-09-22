/**
 * 진행 중인 본인확인 건을 이 브라우저에 묶어 둔다.
 *
 * identityVerificationId 는 주소창에 그대로 노출된다(모바일 redirect 방식). 그래서 브라우저가 보내 온 id 를
 * 그대로 믿으면, 남이 방금 인증한 id 를 주워서 붙여 넣는 것만으로 남의 인증 결과를 가져다 쓸 수 있다.
 * 발급할 때 서명된 짧은 쿠키에 id 를 적어 두고, 돌아왔을 때 그 쿠키와 같은 id 인지 본다.
 */
import { cookies } from "next/headers";
import { signShortToken, verifyToken } from "@/lib/auth/token";

export const PENDING_COOKIE = "icha_iv";
const PENDING_MINUTES = 15;

export type PendingIdentity = { ivId: string };

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
  return { ivId: p.ivId };
}

export async function clearPending(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
}
