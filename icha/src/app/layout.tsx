import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} — ${BRAND.unionName}`, template: `%s — ${BRAND.name}` },
  description: BRAND.ruleOneLiner,
  openGraph: { title: `${BRAND.name} ${BRAND.hanja} — ${BRAND.unionName}`, description: BRAND.tagline, locale: "ko_KR", type: "website" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        {/* 도장 잉크 번짐 필터 (한 번만 정의) */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
          <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
