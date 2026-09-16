"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";
import styles from "./TabBar.module.css";

const I = {
  home: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z" />,
  ticket: <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4zM10 6v12" />,
  pin: <path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v.5M12 11v6" />,
};

/** 하단 탭 — 홈 / 쿠폰함 / 플레이스(시트) / 안내 */
export function TabBar({ stores }: { stores: PlaceSheetStore[] }) {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const item = (href: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link key={label} href={href} className={`${styles.item} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{icon}</svg>
      <span>{label}</span>
    </Link>
  );
  return (
    <>
      <nav className={`fixed-col ${styles.bar}`} aria-label="하단 메뉴">
        {item("/", "홈", I.home, path === "/" || path.startsWith("/stores"))}
        {item("/wallet", "쿠폰함", I.ticket, path.startsWith("/wallet") || path.startsWith("/coupons") || path.startsWith("/pick") || path.startsWith("/login"))}
        <button type="button" className={`${styles.item} ${styles.naver}`} onClick={() => setOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{I.pin}</svg>
          <span>플레이스</span>
        </button>
        {item("/guide", "안내", I.info, path.startsWith("/guide"))}
      </nav>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
