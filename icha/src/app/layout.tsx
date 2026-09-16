import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/config";

const TITLE = `${BRAND.name} — ${BRAND.unionName}`;
/** 검색·공유 미리보기 한 문장 — 포스터의 규칙을 해요체로 */
const DESCRIPTION = "서면 50m 안 세 집(도쿄스탠드·조선칼국수·와르르맨숀)에서 한 집 계산할 때 휴대폰 번호를 말하면, 다음 집에서 메인안주 1개 주문할 때 그 집 특별 혜택을 드려요.";
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
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
