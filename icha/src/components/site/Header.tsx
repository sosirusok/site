"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/config";
import { useMemberPhone } from "./useMember";
import styles from "./Header.module.css";

/**
 * 손님 화면 상단 바. 홈에서는 사진 편집 흐름을 방해하지 않도록 한 번만 지나간다.
 * 공개 홈에서는 로그인 상태와 무관하게 쿠폰함으로 바로 이어진다.
 */
export function Header() {
  const phone = useMemberPhone();
  const path = usePathname() ?? "/";
  const [mounted, setMounted] = useState(false);

  // 정적 생성 시에는 경로를 확정할 수 없으므로 서버와 첫 브라우저 렌더를 비워서 일치시킨다.
  useEffect(() => setMounted(true), []);

  const isHome = mounted && path === "/";
  return (
    <header className={styles.header} data-home={isHome ? "true" : undefined}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
          <Image src="/images/diamond/wordmark.png" alt="" aria-hidden="true" width={900} height={162} sizes="160px" className={styles.markImage} />
        </Link>
        <div className={styles.actions}>
          {!mounted ? null : isHome ? (
            <Link href="/wallet" className={styles.actionLink}>쿠폰함</Link>
          ) : phone ? (
            path !== "/wallet" ? <Link href="/wallet" className={styles.actionLink}>쿠폰</Link> : null
          ) : path !== "/login" ? (
            <Link href="/login" className={styles.actionLink}>로그인</Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
