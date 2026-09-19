"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";
import styles from "./TabBar.module.css";

/**
 * 하단 탭(62px) — 선 아이콘 세트를 쓰지 않는다. 대신 Anton 영문 소문자 라벨(9px, 넓은 트래킹) 위에 Black Han Sans 한글(15px).
 * 고른 탭은 라임으로 빛나고 위쪽에 형광 막대가 선다. (텍스트 전용 하단 내비 — 카트러시 이벤트 페이지 방식)
 */
type Tab = { href: string; ko: string; en: string; active: (p: string) => boolean };

const TABS: Tab[] = [
  { href: "/", ko: "홈", en: "HOME", active: (p) => p === "/" || p.startsWith("/stores") },
  { href: "/wallet", ko: "쿠폰함", en: "WALLET", active: (p) => p.startsWith("/wallet") || p.startsWith("/coupons") || p.startsWith("/pick") || p.startsWith("/login") },
  { href: "/guide", ko: "안내", en: "GUIDE", active: (p) => p.startsWith("/guide") || p.startsWith("/verify") },
];

export function TabBar({ stores }: { stores: PlaceSheetStore[] }) {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [home, wallet, guide] = TABS as [Tab, Tab, Tab];
  const cell = (t: Tab) => (
    <Link key={t.href} href={t.href} className={`${styles.item} ${t.active(path) ? styles.active : ""}`} aria-current={t.active(path) ? "page" : undefined}>
      <span className={styles.en} aria-hidden="true">{t.en}</span>
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
          <span className={styles.en} aria-hidden="true">BOOK</span>
          <span className={styles.ko}>예약</span>
        </button>
        {cell(guide)}
      </nav>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
