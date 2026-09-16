"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { art } from "@/lib/art";
import styles from "./TabBar.module.css";

/** 모바일 하단 이동 메뉴 — 사장님 자산(5번)의 구성: 홈 / 영수증 인증 / 쿠폰함 / 내 혜택 */
export function TabBar({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname() ?? "/";
  const items = [
    { href: "/", label: "홈", icon: null, active: path === "/" },
    { href: "/verify", label: "영수증 인증", icon: art("icon-receipt"), active: path.startsWith("/verify") || path.startsWith("/pick") },
    { href: "/wallet", label: "쿠폰함", icon: art("icon-coupon"), active: path.startsWith("/wallet") || path.startsWith("/coupons") },
    { href: loggedIn ? "/wallet#tier" : "/login", label: "내 혜택", icon: art("icon-vip"), active: path.startsWith("/login") },
  ];
  return (
    <nav className={styles.bar} aria-label="하단 메뉴">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={`${styles.item} ${it.active ? styles.active : ""}`} aria-current={it.active ? "page" : undefined}>
          <span className={styles.icon} aria-hidden="true">
            {it.icon ? (
              <Image src={it.icon.src} alt="" width={it.icon.width} height={it.icon.height} style={{ width: 28, height: 28, objectFit: "contain" }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M4 13.5 14 5l10 8.5" />
                <path d="M6.5 12v11h5.5v-6.5h4V23h5.5V12" />
              </svg>
            )}
          </span>
          <span className={styles.label}>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
