import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES, naverPlaceUrl } from "@/lib/stores";
import { Art } from "@/components/art/Art";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.brand}>
          <Art name="logo" alt="" width={56} />
          <p><b>{BRAND.name}</b> · {BRAND.unionName}</p>
        </div>
        <ul className={styles.stores}>
          {STORES.map((s) => (
            <li key={s.id}>
              <Link href={`/stores/${s.id}`} className={styles.storeName}>{s.shortName}</Link>
              {s.phone && <a href={`tel:${s.phone.replace(/-/g, "")}`}>{s.phone}</a>}
              {naverPlaceUrl(s) && <a href={naverPlaceUrl(s)!} target="_blank" rel="noreferrer">네이버 플레이스</a>}
            </li>
          ))}
        </ul>
        <p className={styles.links}>
          <Link href="/guide">이용 안내</Link>
          <Link href="/admin/login">직원 페이지</Link>
        </p>
        <p className={styles.note}>영수증 사진은 부정 사용 확인에만 쓰고, 보관 기간이 지나면 지워요.</p>
      </div>
    </footer>
  );
}
