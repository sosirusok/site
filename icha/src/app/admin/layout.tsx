import type { Metadata, Viewport } from "next";
import ui from "./admin.module.css";

export const metadata: Metadata = {
  title: { default: "관리자 — 이차", template: "%s — 이차 관리자" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1a1714",
  width: "device-width",
  initialScale: 1,
};

/** 관리자 영역 공통 껍데기 — 손님 사이트와 다른 바탕/활자. 세션 확인은 (shell) 레이아웃에서 한다. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className={ui.root}>{children}</div>;
}
