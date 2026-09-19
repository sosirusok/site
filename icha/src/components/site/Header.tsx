"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND, maskPhone } from "@/lib/config";
import { useMemberPhone } from "./useMember";
import styles from "./Header.module.css";

/**
 * 맨 위 흰 바(56px, 붙박이) — 왼쪽 로고(포스터 제목 글자, 30px), 오른쪽 [로그인] 또는 내 번호(쿠폰함으로).
 * 로그인 상태는 정적 HTML 이 모르므로 마운트 뒤 /api/auth/me 로 알아낸다(useMemberPhone). 로그인 화면에서는 오른쪽을 비운다.
 */
export function Header() {
  const phone = useMemberPhone();
  const path = usePathname() ?? "/";
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
        <Image src="/images/kit/title.png" alt="" width={1400} height={480} sizes="100px" priority className={styles.logo} draggable={false} />
      </Link>
      {phone ? (
        <Link href="/wallet" className={styles.me} aria-label={`내 쿠폰함 (${maskPhone(phone)})`}>
          <span className={`badge badge-line badge-lg num ${styles.meTag}`}>{maskPhone(phone)}</span>
        </Link>
      ) : path !== "/login" ? (
        <Link href="/login" className="btn btn-outline btn-sm">로그인</Link>
      ) : null}
    </header>
  );
}
