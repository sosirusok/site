import Link from "next/link";
import { BRAND, maskPhone } from "@/lib/config";
import { getMemberSession } from "@/lib/auth/session";
import styles from "./Header.module.css";

export async function Header() {
  const session = await getMemberSession();
  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
          <span className={styles.mark}>{BRAND.name}</span>
          <span className={styles.sub}>
            <b>{BRAND.hanja}</b> {BRAND.unionName}
          </span>
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <Link href="/#stores">매장</Link>
          <Link href="/#map">찾아오는 길</Link>
          <Link href="/guide">이용 방법</Link>
          <Link href="/wallet">내 쿠폰</Link>
        </nav>
        <div className={styles.side}>
          {session ? (
            <Link href="/wallet" className={styles.phone} title="내 쿠폰함">
              <span className="mono">{maskPhone(session.phone)}</span>
              <span className={styles.phoneLabel}>쿠폰함</span>
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
