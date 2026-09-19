import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/config";

/** 본문 글꼴 Pretendard(가변, 동적 서브셋) — CDN 의 CSS 53KB(92 @font-face, font-display: swap) */
const PRETENDARD_CSS = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";
/**
 * Pretendard CSS 를 그리기를 막지 않게 받는다: <link rel="preload" as="style"> 로 먼저 받아 두고, 이 인라인 스크립트가 media="print" 스타일시트로 붙였다가
 * 다 받으면 media="all" 로 바꾼다(브라우저는 맞지 않는 media 의 CSS 를 기다리지 않는다). 하이드레이션과 무관하게 HTML 을 읽는 즉시 돈다. JS 가 꺼져 있으면 <noscript> 의 보통 링크.
 */
const PRETENDARD_LOADER = `(function(){var l=document.createElement("link");l.rel="stylesheet";l.href=${JSON.stringify(PRETENDARD_CSS)};l.media="print";l.onload=function(){this.media="all"};document.head.appendChild(l)})()`;

const TITLE = `${BRAND.name} — ${BRAND.unionName}`;
/** 검색·공유 미리보기 — 포스터의 규칙을 매장 안내문처럼 합니다체로 */
const DESCRIPTION = "서면 50m 이내 3개 매장(도쿄스탠드·조선칼국수·와르르맨숀) 콜라보. 한 매장 계산 시 휴대폰 번호를 말씀하시면 쿠폰이 발급되고, 다른 매장에서 메인안주 1개 주문 시 매장별 특별 혜택을 드립니다.";
/** 공유 미리보기 — 키트의 밤 술집 사진(1200x630, 카톡·네이버·트위터 큰 카드). 포스터 원본은 두 번째로 둔다 */
const SHARE_IMAGE = { url: "/images/kit/share.jpg", width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.unionName}` };
const POSTER_IMAGE = { url: "/images/event/poster.jpg", width: 1080, height: 1350, alt: `${BRAND.name} 포스터 — ${BRAND.unionName}` };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s — ${BRAND.name}` },
  description: DESCRIPTION,
  applicationName: BRAND.name,
  formatDetection: { telephone: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: BRAND.name,
    locale: "ko_KR",
    type: "website",
    images: [SHARE_IMAGE, POSTER_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [{ url: SHARE_IMAGE.url, alt: SHARE_IMAGE.alt, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height }] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#06030c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        {/* 첫 화면의 간판 글자(Black Han Sans 한글·라틴)와 영문 라벨(Anton) — 자체 호스팅, 바로 미리 받는다 */}
        <link rel="preload" as="font" type="font/woff2" href="/fonts/black-han-sans-korean-400-normal.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href="/fonts/anton-latin-400-normal.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="style" href={PRETENDARD_CSS} />
        <script dangerouslySetInnerHTML={{ __html: PRETENDARD_LOADER }} />
        <noscript dangerouslySetInnerHTML={{ __html: `<link rel="stylesheet" href="${PRETENDARD_CSS}">` }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
