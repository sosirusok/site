import Link from "next/link";
import { BRAND, maskPhone } from "@/lib/config";
import { getMemberSession } from "@/lib/auth/session";
import { TabBar } from "./TabBar";
import { Art } from "@/components/art/Art";
import styles from "./Header.module.css";

export async function Header() {
  const session = await getMemberSession();
  return (
    <>
      <header className={styles.header}>
        <div className={`wrap ${styles.inner}`}>
          <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
            <Art name="logo" className={styles.logo} sizes="48px" priority />
            <span className={styles.mark}>{BRAND.name}</span>
            <span className={styles.sub}>{BRAND.unionName}</span>
          </Link>
          <nav className={styles.nav} aria-label="주요 메뉴">
            <Link href="/#stores">세 집</Link>
            <Link href="/#gifts">무료 한 잔</Link>
            <Link href="/#map">오시는 길</Link>
            <Link href="/guide">이용 안내</Link>
            <Link href="/wallet">쿠폰함</Link>
          </nav>
          <div className={styles.side}>
            {session ? (
              <Link href="/wallet" className={styles.phone} title="내 쿠폰함">
                <span className="mono">{maskPhone(session.phone)}</span>
              </Link>
            ) : (
              <Link href="/verify" className={styles.cta}>
                영수증 인증
              </Link>
            )}
          </div>
        </div>
      </header>
      <TabBar loggedIn={Boolean(session)} />
    </>
  );
}
