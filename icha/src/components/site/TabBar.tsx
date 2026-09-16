"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TabBar.module.css";

const I = {
  home: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z" />,
  receipt: <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21zM9 8h6M9 12h6M9 16h4" />,
  ticket: <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4zM10 6v12" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0" />,
};

/** 하단 탭 — 홈 / 영수증 인증 / 쿠폰함 / 내 정보 */
export function TabBar({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname() ?? "/";
  const items = [
    { href: "/", label: "홈", icon: I.home, active: path === "/" || path.startsWith("/stores") || path === "/guide" },
    { href: "/verify", label: "영수증 인증", icon: I.receipt, active: path.startsWith("/verify") || path.startsWith("/pick") },
    { href: "/wallet", label: "쿠폰함", icon: I.ticket, active: path.startsWith("/wallet") || path.startsWith("/coupons") },
    { href: loggedIn ? "/wallet#tier" : "/login", label: loggedIn ? "내 등급" : "로그인", icon: I.user, active: path.startsWith("/login") },
  ];
  return (
    <nav className={`fixed-col ${styles.bar}`} aria-label="하단 메뉴">
      {items.map((it) => (
        <Link key={it.label} href={it.href} className={`${styles.item} ${it.active ? styles.active : ""}`} aria-current={it.active ? "page" : undefined}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{it.icon}</svg>
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
