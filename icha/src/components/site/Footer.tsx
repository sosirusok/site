import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>{BRAND.name} · {BRAND.unionName}</p>
      <ul className={styles.stores}>
        {STORES.map((s) => (
          <li key={s.id}>{s.name}{s.phone ? ` · ${s.phone}` : ""}{s.bizNo ? ` · 사업자등록번호 ${s.bizNo}` : ""}</li>
        ))}
      </ul>
      <p className={styles.links}><Link href="/guide">이용 안내</Link><Link href="/admin/login">사장님·직원 페이지</Link></p>
      <p className={styles.slogan}>{BRAND.slogan}</p>
    </footer>
  );
}
