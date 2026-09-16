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
    images: [{ url: "/images/event/poster.jpg", width: 1080, height: 1350, alt: `${BRAND.unionName} — 영수증 한 장으로 옆집에서 한 잔` }],
  },
  twitter: { card: "summary_large_image", title: `${BRAND.name} — ${BRAND.unionName}`, description: BRAND.tagline, images: ["/images/event/poster.jpg"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#14101c",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Nanum+Pen+Script&display=swap" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
