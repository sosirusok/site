import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES, naverPlaceUrl } from "@/lib/stores";
import { Art } from "@/components/art/Art";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.brandCol}>
          <Art name="logo" alt="" width={92} className={styles.logo} />
          <p className={styles.brand}>{BRAND.name}</p>
          <p className={styles.union}>{BRAND.unionName}</p>
          <p className={styles.rule}>{BRAND.ruleOneLiner}</p>
          <ul className={styles.links}>
            <li><Link href="/#stores">참여 매장</Link></li>
            <li><Link href="/#map">오시는 길</Link></li>
            <li><Link href="/guide">이용 안내</Link></li>
            <li><Link href="/login">전화번호로 시작</Link></li>
            <li><Link href="/admin/login" className={styles.staff}>직원 페이지</Link></li>
          </ul>
        </div>
        <ul className={styles.stores}>
          {STORES.map((s) => (
            <li key={s.id} className={styles.store}>
              <Art name={`badge-${s.id}`} alt={s.shortName} width={150} />
              <p className={styles.storeName}>{s.name}</p>
              <p>{s.address}</p>
              <p className={styles.storeMeta}>
                {s.phone && <span>전화 {s.phone}</span>}
                {s.bizNo && <span>사업자등록번호 {s.bizNo}</span>}
                {naverPlaceUrl(s) && <a href={naverPlaceUrl(s)!} target="_blank" rel="noreferrer">네이버 플레이스</a>}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className={`wrap ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} {BRAND.unionName}. 매장 사진과 정보는 각 매장이 제공했어요.</p>
        <p>영수증 사진은 부정 사용 확인에만 쓰고(반려 건 7일, 그 외 90일 뒤 삭제) 매장 관리자 외에는 볼 수 없어요.</p>
      </div>
    </footer>
  );
}
