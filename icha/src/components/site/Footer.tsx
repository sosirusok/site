import Link from "next/link";
import { BRAND } from "@/lib/config";
import { naverSearchUrl } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import styles from "./Footer.module.css";

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

/** 모든 손님 화면 맨 아래 — 연회색 바탕, 13px: 이벤트 이름, 세 매장(상호·주소·전화), 링크 한 줄, 저작권. */
export function Footer() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>{BRAND.name} <span className={styles.brandSub}>{BRAND.unionName}</span></p>
      <ul className={styles.stores}>
        {ordered.map((s) => (
          <li key={s.id} className={styles.store}>
            <span className={styles.storeName}>{s.course.n}차 {s.name}</span>
            <span className={styles.addr}>{s.address}</span>
            {s.bizNo && <span className={`num ${styles.addr}`}>사업자등록번호 {s.bizNo}</span>}
            {s.phone && <a href={`tel:${s.phone.replace(/-/g, "")}`} className={`num ${styles.tel}`}>{s.phone}</a>}
          </li>
        ))}
      </ul>
      <nav className={styles.links} aria-label="하단 링크">
        <Link href="/guide" className={styles.link}>이용 안내</Link>
        <Link href="/wallet" className={styles.link}>쿠폰함</Link>
        <a href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스</a>
      </nav>
      <p className={styles.warn}>경고: 지나친 음주는 뇌졸중, 기억력 손상이나 치매를 유발합니다. 임신 중 음주는 기형아 출생 위험을 높입니다. 만 19세 미만에게는 주류를 판매하지 않습니다.</p>
      <p className={styles.copy}>
        <span>© 2026 {BRAND.name}</span>
        <Link href="/admin/login" className={styles.staff}>관리자</Link>
      </p>
    </footer>
  );
}
