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
      <p className={styles.links}><Link href="/guide">이용 안내</Link><Link href="/admin/login">직원용</Link></p>
      <p>영수증 사진은 부정 사용 확인에만 쓰고, 보관 기간이 지나면 지웁니다.</p>
    </footer>
  );
}
