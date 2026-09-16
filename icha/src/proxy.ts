import { NextResponse, type NextRequest } from "next/server";

/**
 * 인증이 필요한 화면을 가볍게 보호한다 (쿠키 존재 여부만 확인; 실제 검증은 각 페이지/API 에서).
 * /verify(쿠폰 받는 법)는 로그인 없이 볼 수 있으므로 여기 없다.
 */
export function proxy(req: NextRequest) {
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
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/wallet", "/wallet/:path*", "/pick/:path*", "/coupons/:path*"],
};
