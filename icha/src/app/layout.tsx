import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} — ${BRAND.unionName}`, template: `%s — ${BRAND.name}` },
  description: BRAND.ruleOneLiner,
  openGraph: {
    title: `${BRAND.name} ${BRAND.hanja} — ${BRAND.unionName}`,
    description: BRAND.tagline,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/art/kakao-share.png", width: 1200, height: 818, alt: `${BRAND.unionName} — 영수증 한 장으로 옆집에서 한 잔` }],
  },
  twitter: { card: "summary_large_image", title: `${BRAND.name} — ${BRAND.unionName}`, description: BRAND.tagline, images: ["/art/kakao-share.png"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
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
        <link rel="preconnect" href="https://fastly.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
