"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TabIcon, type TabIconKind } from "./Kit";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";
import styles from "./TabBar.module.css";

/* 단순한 검은 선 아이콘 — 키트 icon-<home|wallet|place|info>.png 가 있으면 그 그림으로 바뀐다 */
const I: Record<TabIconKind, React.ReactNode> = {
  home: <path d="M4 11 12 4l8 7v9h-5v-6h-6v6H4z" />,
  wallet: <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4zM10 6v12" />,
  place: <path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v.5M12 11v6" />,
};

/** 하단 탭 — 크림색 종이 띠. 홈 / 쿠폰함 / 플레이스(예약 시트) / 안내. 고른 탭은 노란 형광펜. */
export function TabBar({ stores }: { stores: PlaceSheetStore[] }) {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const icon = (kind: TabIconKind) => (
    <TabIcon kind={kind} fallback={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{I[kind]}</svg>} />
  );
  const item = (href: string, label: string, kind: TabIconKind, active: boolean) => (
    <Link key={label} href={href} className={`${styles.item} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
      {icon(kind)}
      <span className={styles.label}>{label}</span>
    </Link>
  );
  return (
    <>
      <nav className={`fixed-col ${styles.bar}`} aria-label="하단 메뉴">
        {item("/", "홈", "home", path === "/" || path.startsWith("/stores"))}
        {item("/wallet", "쿠폰함", "wallet", path.startsWith("/wallet") || path.startsWith("/coupons") || path.startsWith("/pick") || path.startsWith("/login"))}
        <button type="button" className={styles.item} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
          {icon("place")}
          <span className={styles.label}>플레이스</span>
        </button>
        {item("/guide", "안내", "info", path.startsWith("/guide") || path.startsWith("/verify"))}
      </nav>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
