import Link from "next/link";
import { BRAND } from "@/lib/config";
import { getMemberSession } from "@/lib/auth/session";
import { maskPhone } from "@/lib/config";
import styles from "./Header.module.css";

export async function Header() {
  const session = await getMemberSession();
  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
          <span className={`serif ${styles.mark}`}>{BRAND.name}</span>
          <span className={`mono ${styles.hanja}`}>{BRAND.hanja}</span>
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/#stores">매장</Link>
          <Link href="/guide">이용 방법</Link>
          <Link href="/wallet">내 쿠폰</Link>
        </nav>
        <div className={styles.side}>
          {session ? (
            <Link href="/wallet" className={`mono ${styles.phone}`} title="내 쿠폰함">
              {maskPhone(session.phone)}
            </Link>
          ) : (
            <Link href="/login" className={styles.login}>
              번호로 시작
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
