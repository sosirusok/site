import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES, naverPlaceUrl } from "@/lib/stores";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <p className={styles.brand}>
              {BRAND.name} <span>{BRAND.hanja}</span>
            </p>
            <p className={styles.union}>{BRAND.unionName}</p>
            <p className={styles.rule}>{BRAND.ruleOneLiner}</p>
            <ul className={styles.links}>
              <li><Link href="/#stores">매장</Link></li>
              <li><Link href="/#map">찾아오는 길</Link></li>
              <li><Link href="/guide">이용 방법·유의사항</Link></li>
              <li><Link href="/login">번호로 시작하기</Link></li>
              <li><Link href="/admin/login" className={styles.staff}>매장 직원 로그인</Link></li>
            </ul>
          </div>
          <ul className={styles.stores}>
            {STORES.map((s, i) => (
              <li key={s.id} className={styles.store}>
                <p className={styles.storeName}>
                  <span className={styles.storeNum}>{String(i + 1).padStart(2, "0")}</span>
                  {s.name}
                  <span className={styles.drink}>{s.drink}</span>
                </p>
                <p className={styles.storeLine}>{s.address}</p>
                <p className={styles.storeLine}>
                  {s.phone && <span>전화 {s.phone}</span>}
                  {s.bizNo && <span>사업자등록번호 {s.bizNo}</span>}
                </p>
                {naverPlaceUrl(s) && (
                  <a className={styles.naver} href={naverPlaceUrl(s)!} target="_blank" rel="noreferrer">
                    네이버 플레이스 ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} {BRAND.unionName}. 매장 사진과 정보는 각 매장이 제공했습니다.</p>
          <p>영수증 사진은 부정 사용 확인을 위해서만 보관하며, 매장 직원 외에는 볼 수 없습니다.</p>
        </div>
      </div>
    </footer>
  );
}
