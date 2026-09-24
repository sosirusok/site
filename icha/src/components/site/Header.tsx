"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/config";
import { useMemberPhone } from "./useMember";
import styles from "./Header.module.css";

/**
 * 손님 화면 상단 바. 홈에서는 사진 편집 흐름을 방해하지 않도록 한 번만 지나간다.
 * 로그인 상태는 정적 HTML 이 모르므로 마운트 뒤 /api/auth/me 로 알아낸다(useMemberPhone).
 */
export function Header() {
  const phone = useMemberPhone();
  const path = usePathname() ?? "/";
  return (
    <header className={styles.header} data-home={path === "/" ? "true" : undefined}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
          <Image src="/images/afterdark/wordmark-header.png" alt="" aria-hidden="true" width={900} height={210} sizes="112px" priority className={styles.markImage} />
        </Link>
        <div className={styles.actions}>
          {phone ? (
            <Link href="/wallet" className={styles.actionLink}>쿠폰</Link>
          ) : path !== "/login" ? (
            <Link href="/login" className={styles.actionLink}>로그인</Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
