import Link from "next/link";
import { BRAND, maskPhone } from "@/lib/config";
import { Art } from "@/components/art/Art";
import styles from "./Header.module.css";

/** 앱 상단 바 — 왼쪽 로고, 오른쪽 로그인 상태. 화면 폭 480px 한 단에 고정. */
export function Header({ loggedIn, phone }: { loggedIn: boolean; phone: string | null }) {
  return (
    <header className={`fixed-col ${styles.header}`}>
      <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
        <Art name="logo" alt="" width={26} priority />
        <span>{BRAND.name}</span>
      </Link>
      {loggedIn && phone ? (
        <Link href="/wallet" className={styles.me}>{maskPhone(phone)}</Link>
      ) : (
        <Link href="/login" className={styles.me}>로그인</Link>
      )}
    </header>
  );
}
