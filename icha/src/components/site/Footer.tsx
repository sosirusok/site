import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES, naverPlaceUrl } from "@/lib/stores";
import { DrinkIcon } from "@/components/ui/icons";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <hr className="rule-thick" />
        <div className={styles.grid}>
          <div className={styles.about}>
            <p className={`serif ${styles.brand}`}>
              {BRAND.name} <span className="mono">{BRAND.hanja}</span>
            </p>
            <p className={styles.tag}>{BRAND.unionName}</p>
            <p className="small">{BRAND.ruleOneLiner}</p>
            <ul className={styles.links}>
              <li><Link href="/guide">이용 방법과 유의사항</Link></li>
              <li><Link href="/login">번호로 시작하기</Link></li>
              <li><Link href="/admin/login" className={styles.staff}>매장 직원</Link></li>
            </ul>
          </div>
          <ul className={styles.stores}>
            {STORES.map((s) => (
              <li key={s.id} data-store={s.id} className={styles.store}>
                <span className={styles.icon}><DrinkIcon drink={s.drink} size={22} /></span>
                <div>
                  <p className={styles.name}>{s.name}</p>
                  <p className={`mono ${styles.addr}`}>{s.address}</p>
                  {s.phone && <p className={`mono ${styles.addr}`}>{s.phone}</p>}
                  {naverPlaceUrl(s) && (
                    <a className={styles.naver} href={naverPlaceUrl(s)!} target="_blank" rel="noreferrer">네이버 플레이스 ↗</a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className={`mono ${styles.copy}`}>© {new Date().getFullYear()} {BRAND.unionName}. 사진과 매장 정보는 각 매장 제공.</p>
      </div>
    </footer>
  );
}
