import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import styles from "./Footer.module.css";

/** 모든 손님 화면 맨 아래 — 매장 이름·전화, 안내 링크, 포스터 문구 한 줄 */
export function Footer() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>{BRAND.name} · {BRAND.unionName}</p>
      <ul className={styles.stores}>
        {ordered.map((s) => (
          <li key={s.id}>{s.name}{s.phone ? ` · ${s.phone}` : ""}</li>
        ))}
      </ul>
      <p className={styles.links}><Link href="/guide">이용 안내</Link><Link href="/admin/login">사장님·직원 페이지</Link></p>
      <p className={styles.slogan}>{BRAND.slogan}</p>
    </footer>
  );
}
