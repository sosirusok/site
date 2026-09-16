import Link from "next/link";
import { BRAND, maskPhone } from "@/lib/config";
import styles from "./Header.module.css";

/** 앱 상단 바 — 왼쪽 이벤트 이름(네온), 오른쪽 로그인 상태 */
export function Header({ loggedIn, phone }: { loggedIn: boolean; phone: string | null }) {
  return (
    <header className={`fixed-col ${styles.header}`}>
      <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>{BRAND.name}</Link>
      {loggedIn && phone ? (
        <Link href="/wallet" className={styles.me}>{maskPhone(phone)}</Link>
      ) : (
        <Link href="/login" className={styles.me}>로그인</Link>
      )}
    </header>
  );
}
