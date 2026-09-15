import Image from "next/image";
import Link from "next/link";
import { distanceM, SEOMYEON_STATION, walkMinutes } from "@/lib/geo";
import { naverPlaceUrl, STORES } from "@/lib/stores";
import { heroImage, openStatus } from "./StoreHelpers";
import styles from "./HomeStores.module.css";

/** 세 곳, 세 가지 술 — 매장당 큰 실사진 카드. 번호·이름·술·오늘 영업·도보 시간·버튼 두 개. */
export function HomeStores() {
  const now = new Date();
  return (
    <ol className={styles.grid}>
      {STORES.map((s, i) => {
        const img = heroImage(s);
        const st = openStatus(s, now);
        const walk = s.lat != null && s.lng != null ? walkMinutes(distanceM(SEOMYEON_STATION, { lat: s.lat, lng: s.lng })) : null;
        const naver = naverPlaceUrl(s);
        return (
          <li key={s.id} className={`${styles.card} rise rise-d${i + 1}`}>
            <Link href={`/stores/${s.id}`} className={styles.photo} aria-label={`${s.shortName} 자세히`}>
              {img && <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1000px) 33vw, (min-width: 760px) 50vw, 100vw" className={styles.img} />}
              <span className={styles.num} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className={`${styles.status} ${st.open ? styles.open : ""}`}>{st.short}</span>
            </Link>
            <div className={styles.body}>
              <p className={styles.drink}>{s.drink}</p>
              <h3 className={styles.name}>
                <Link href={`/stores/${s.id}`}>{s.shortName}</Link>
              </h3>
              <p className={styles.headline}>{s.headline}</p>
              <dl className={styles.meta}>
                <div><dt>오늘</dt><dd className="num">{st.today}</dd></div>
                <div><dt>{SEOMYEON_STATION.name}에서</dt><dd className="num">{walk != null ? `도보 ${walk}분` : "-"}</dd></div>
              </dl>
              <div className={styles.actions}>
                <Link href={`/stores/${s.id}`} className="btn btn-outline btn-sm">매장 자세히</Link>
                {naver && <a href={naver} target="_blank" rel="noreferrer" className={styles.naver}>네이버 플레이스 ↗</a>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
