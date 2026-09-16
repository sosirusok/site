import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES, naverPlaceUrl } from "@/lib/stores";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.top}>
          <div>
            <p className={styles.brand}>{BRAND.name}</p>
            <p className={styles.union}>{BRAND.unionName} · {BRAND.ruleOneLiner}</p>
            <ul className={styles.links}>
              <li><Link href="/#stores">참여 매장</Link></li>
              <li><Link href="/#map">오시는 길</Link></li>
              <li><Link href="/guide">이용 안내</Link></li>
              <li><Link href="/login">전화번호 로그인</Link></li>
              <li><Link href="/admin/login" className={styles.staff}>직원 페이지</Link></li>
            </ul>
          </div>
          <ul className={styles.stores}>
            {STORES.map((s) => (
              <li key={s.id} className={styles.store}>
                <p className={styles.storeName}>{s.name}</p>
                <p>{s.address}</p>
                <p>
                  {s.phone && <span>전화 {s.phone}</span>}
                  {s.bizNo && <span>사업자등록번호 {s.bizNo}</span>}
                  {naverPlaceUrl(s) && (
                    <a href={naverPlaceUrl(s)!} target="_blank" rel="noreferrer">네이버 플레이스</a>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} {BRAND.unionName}. 매장 사진과 정보는 각 매장이 제공했습니다.</p>
          <p>영수증 사진은 부정 사용 확인 목적으로만 보관하며(반려 건 7일, 그 외 90일 뒤 삭제) 매장 관리자 외에는 열람할 수 없습니다.</p>
        </div>
      </div>
    </footer>
  );
}
