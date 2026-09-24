"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/config";
import { useMemberPhone } from "./useMember";
import styles from "./Header.module.css";

/**
 * 손님 화면 상단 바. 홈에서는 따뜻한 종이색의 편집형 헤더를 쓰고,
 * 나머지 흐름 화면에서는 기존 어두운 앱 셸과 자연스럽게 이어진다.
 * 로그인 상태는 정적 HTML 이 모르므로 마운트 뒤 /api/auth/me 로 알아낸다(useMemberPhone).
 */
export function Header() {
  const phone = useMemberPhone();
  const path = usePathname() ?? "/";
  return (
    <header className={styles.header} data-home={path === "/" ? "true" : undefined}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
          <span className={styles.mark}>{BRAND.name}</span>
          <span className={styles.markEn} aria-hidden="true">서면 · 세 매장 · 50M</span>
        </Link>
        {path === "/" ? (
          <nav className={styles.nav} aria-label="홈 주요 메뉴">
            <a href="#stores">세 집 코스</a>
            <a href="#map">오시는 길</a>
            <a href="#howto">혜택 받기</a>
          </nav>
        ) : null}
        <div className={styles.actions}>
          {phone ? (
            <Link href="/wallet" className={styles.me} aria-label="내 쿠폰함">
              <span className={styles.meTag}>내 쿠폰함</span>
            </Link>
          ) : path !== "/login" ? (
            <Link href="/login" className={`btn btn-outline btn-sm ${styles.login}`}>로그인</Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
