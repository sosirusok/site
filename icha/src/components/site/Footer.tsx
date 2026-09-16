import Link from "next/link";
import { BRAND } from "@/lib/config";
import { naverSearchUrl } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import { Piece } from "./Poster";
import styles from "./Footer.module.css";

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

/**
 * 모든 손님 화면 맨 아래 — 포스터 마지막 줄 조각 아래 어두운 띠.
 * 세 매장(차수·상호·주소·전화), 작은 링크 한 줄, 저작권 한 줄. Pretendard 13px 크림색. 실제 매장이 운영하는 사이트의 발.
 */
export function Footer() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <footer className={styles.footer}>
      <Piece name="footer-line" bare className={styles.line} sizes="(min-width: 480px) 480px, 100vw" />
      <div className={styles.strip}>
        <ul className={styles.stores}>
          {ordered.map((s) => (
            <li key={s.id} className={styles.store}>
              <span className={styles.storeName}>{s.course.n}차 {s.name}</span>
              <span className={styles.dot} aria-hidden="true"> · </span>
              <span className={styles.addr}>{s.address}</span>
              {s.phone && (
                <>
                  <span className={styles.dot} aria-hidden="true"> · </span>
                  <a href={`tel:${s.phone.replace(/-/g, "")}`} className={`num ${styles.tel}`}>{s.phone}</a>
                </>
              )}
            </li>
          ))}
        </ul>
        <nav className={styles.links} aria-label="하단 링크">
          <Link href="/guide" className={styles.link}>이용 안내</Link>
          <span className={styles.sep} aria-hidden="true">·</span>
          <Link href="/wallet" className={styles.link}>쿠폰함</Link>
          <span className={styles.sep} aria-hidden="true">·</span>
          <a href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스</a>
        </nav>
        <p className={styles.copy}>
          <span>© 2026 {BRAND.name} · {BRAND.unionName}</span>
          <Link href="/admin/login" className={styles.staff}>관리자</Link>
        </p>
      </div>
    </footer>
  );
}
