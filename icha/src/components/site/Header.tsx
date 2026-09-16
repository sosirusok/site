import Image from "next/image";
import Link from "next/link";
import { BRAND, maskPhone } from "@/lib/config";
import { PIECES } from "./Poster";
import styles from "./Header.module.css";

/** 맨 위 한 줄 — 보케 위에 그대로. 왼쪽은 포스터 제목 조각(26px), 오른쪽은 종이 꼬리표(로그인 / 내 번호). 판·그늘 없음. */
export function Header({ loggedIn, phone }: { loggedIn: boolean; phone: string | null }) {
  const t = PIECES.title;
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label={`${BRAND.name} 홈`}>
        <Image src={t.src} alt={t.alt} width={t.w} height={t.h} sizes="150px" priority className={styles.brandImg} draggable={false} />
      </Link>
      {loggedIn && phone ? (
        <Link href="/wallet" className={styles.me}><span className={styles.meTag}>{maskPhone(phone)}</span></Link>
      ) : (
        <Link href="/login" className={styles.me}><span className={styles.meTag}>로그인</span></Link>
      )}
    </header>
  );
}
