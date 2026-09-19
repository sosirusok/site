"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/config";
import { useMemberPhone } from "./useMember";
import styles from "./Header.module.css";

/**
 * 맨 위 바(54px, 붙박이) — 왼쪽은 이미지가 아니라 Black Han Sans 로 찍은 간판 글자("알콜부시기", 마젠타·시안 발광)와
 * 그 아래 Anton 영문 한 줄. 오른쪽은 [로그인] 또는 [쿠폰함] — 남이 보는 화면에 번호를 띄우지 않는다.
 * 아이콘은 쓰지 않는다. 탭 바에서 아이콘을 다 걷어낸 화면에 선 아이콘 하나만 남으면 그게 더 튄다.
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
          <span className={styles.meTag}>쿠폰함</span>
        </Link>
      ) : path !== "/login" ? (
        <Link href="/login" className="btn btn-outline btn-sm">로그인</Link>
      ) : null}
    </header>
  );
}
