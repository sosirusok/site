import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/components/flow/format";
import { verifyMemberToken } from "@/lib/auth/token";

/**
 * 인증이 필요한 화면을 가볍게 보호한다 (쿠키 존재 여부만 확인; 실제 검증은 각 페이지/API 에서).
 * /verify(쿠폰 받는 법)는 로그인 없이 볼 수 있으므로 여기 없다.
 * /login 은 정적 HTML 이라 스스로 세션을 읽지 못한다 — 서명이 맞는 회원 쿠키가 있으면(이미 로그인) 여기서 next 로 보낸다(예전에 페이지가 하던 일).
 * 쿠키가 있어도 서명이 틀리면 보내지 않으므로 /wallet(검증 실패 → /login) 과 서로 튕기는 일이 없다.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.get("icha_admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  if (["/wallet", "/pick"].some((p) => pathname === p || pathname.startsWith(`${p}/`)) || pathname.startsWith("/coupons/")) {
    if (!req.cookies.get("icha_member")) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  if (pathname === "/login") {
    const token = req.cookies.get("icha_member")?.value;
    if (token && (await verifyMemberToken(token).catch(() => null))) {
      const next = safeNext(req.nextUrl.searchParams.get("next") ?? undefined, "/wallet");
      return NextResponse.redirect(new URL(next, req.nextUrl.origin));
    }
  }
  return NextResponse.next();
}

/**
 * 위 분기는 쿠키가 있느냐 없느냐로만 갈린다 — 그래서 할 일이 있을 때만 들르게 조건을 단다.
 * 로그인한 손님의 쿠폰함·관리자 화면, 로그인 안 한 손님의 /login(정적, CDN 에서 바로 나감)은 이 함수를 거치지 않는다.
 * 빌드할 때 그대로 읽으므로 값은 변수 없이 적는다.
 */
export const config = {
  matcher: [
    { source: "/admin/:path*", missing: [{ type: "cookie", key: "icha_admin" }] },
    { source: "/wallet", missing: [{ type: "cookie", key: "icha_member" }] },
    { source: "/wallet/:path*", missing: [{ type: "cookie", key: "icha_member" }] },
    { source: "/pick/:path*", missing: [{ type: "cookie", key: "icha_member" }] },
    { source: "/coupons/:path*", missing: [{ type: "cookie", key: "icha_member" }] },
    { source: "/login", has: [{ type: "cookie", key: "icha_member" }] },
  ],
};
