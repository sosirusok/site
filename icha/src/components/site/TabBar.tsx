"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";
import styles from "./TabBar.module.css";

type Kind = "home" | "wallet" | "book" | "info";

/* 선 아이콘 24px */
const ICON: Record<Kind, React.ReactNode> = {
  home: <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />,
  wallet: <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM9 7v12" />,
  book: <path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 14l2 2 4-4" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M11 12h1v4h1" />,
};

/** 하단 탭(60px, 흰 바탕) — 홈 / 쿠폰함 / 예약(매장 고르는 시트) / 안내. 고른 탭은 검정, 나머지 회색. */
export function TabBar({ stores }: { stores: PlaceSheetStore[] }) {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const icon = (kind: Kind) => (
    <svg className={styles.icon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {ICON[kind]}
    </svg>
  );
  const item = (href: string, label: string, kind: Kind, active: boolean) => (
    <Link key={label} href={href} className={`${styles.item} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
      {icon(kind)}
      <span className={styles.label}>{label}</span>
    </Link>
  );
  return (
    <>
      <nav className={`fixed-col tabbar ${styles.bar}`} aria-label="하단 메뉴">
        {item("/", "홈", "home", path === "/" || path.startsWith("/stores"))}
        {item("/wallet", "쿠폰함", "wallet", path.startsWith("/wallet") || path.startsWith("/coupons") || path.startsWith("/pick") || path.startsWith("/login"))}
        <button type="button" className={styles.item} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
          {icon("book")}
          <span className={styles.label}>예약</span>
        </button>
        {item("/guide", "안내", "info", path.startsWith("/guide") || path.startsWith("/verify"))}
      </nav>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
