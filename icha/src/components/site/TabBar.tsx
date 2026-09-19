"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";
import styles from "./TabBar.module.css";

/**
 * 하단 탭(62px) — 아이콘도, 한글 옆 영문 번역도 쓰지 않는다. Black Han Sans 한글 한 줄뿐이다.
 * "WALLET / 쿠폰함"처럼 같은 뜻의 영문을 나란히 붙이는 건 정보가 0인 장식이고, 부산 서면 술집 손님이 읽을 말도 아니다.
 * 지금 있는 칸은 칸 전체가 라임 색면이 된다. 예약은 초록 글자와 위 초록선으로 구분한다.
 */
type Tab = { href: string; ko: string; active: (p: string) => boolean };

const TABS: Tab[] = [
  { href: "/", ko: "홈", active: (p) => p === "/" || p.startsWith("/stores") },
  { href: "/wallet", ko: "쿠폰함", active: (p) => p.startsWith("/wallet") || p.startsWith("/coupons") || p.startsWith("/pick") || p.startsWith("/login") },
  { href: "/guide", ko: "안내", active: (p) => p.startsWith("/guide") || p.startsWith("/verify") },
];

export function TabBar({ stores }: { stores: PlaceSheetStore[] }) {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [home, wallet, guide] = TABS as [Tab, Tab, Tab];
  const cell = (t: Tab) => (
    <Link key={t.href} href={t.href} className={`${styles.item} ${t.active(path) ? styles.active : ""}`} aria-current={t.active(path) ? "page" : undefined}>
      <span className={styles.ko}>{t.ko}</span>
    </Link>
  );
  return (
    <>
      <nav className={`fixed-col tabbar ${styles.bar}`} aria-label="하단 메뉴">
        {cell(home)}
        {cell(wallet)}
        {/* 예약은 탭이 아니라 바텀시트를 여는 버튼 — 초록 글자와 위 초록선으로만 구분한다(색면은 "지금 있는 칸" 전용) */}
        <button type="button" className={`${styles.item} ${styles.book}`} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
          <span className={styles.ko}>예약</span>
        </button>
        {cell(guide)}
      </nav>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
