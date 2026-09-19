"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/config";
import { useMemberPhone } from "./useMember";
import styles from "./Header.module.css";

/**
 * 맨 위 바(54px, 붙박이) — 왼쪽은 이미지가 아니라 Black Han Sans 로 찍은 간판 글자("알콜부시기", 마젠타·시안 발광)와
 * 그 아래 Anton 영문 한 줄. 오른쪽은 [로그인] 또는 [쿠폰함] — 남이 보는 화면에 번호를 띄우지 않는다.
 * 로그인 상태는 정적 HTML 이 모르므로 마운트 뒤 /api/auth/me 로 알아낸다(useMemberPhone). 로그인 화면에서는 오른쪽을 비운다.
 */
export function Header() {
  const phone = useMemberPhone();
  const path = usePathname() ?? "/";
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
        <span className={styles.mark}>{BRAND.name}</span>
        <span className={styles.markEn} aria-hidden="true">SEOMYEON 3 BARS</span>
      </Link>
      {phone ? (
        <Link href="/wallet" className={styles.me} aria-label="내 쿠폰함">
          <span className={styles.meTag}>
            <svg className={styles.meIcon} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M3 7h18v3.2a2 2 0 0 0 0 3.6V17H3v-3.2a2 2 0 0 0 0-3.6V7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M13 7v2.2M13 14.8V17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            쿠폰함
          </span>
        </Link>
      ) : path !== "/login" ? (
        <Link href="/login" className="btn btn-outline btn-sm">로그인</Link>
      ) : null}
    </header>
  );
}
