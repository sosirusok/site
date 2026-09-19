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

export const config = {
  matcher: ["/admin/:path*", "/wallet", "/wallet/:path*", "/pick/:path*", "/coupons/:path*", "/login"],
};
