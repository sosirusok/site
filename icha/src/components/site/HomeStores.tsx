import Image from "next/image";
import Link from "next/link";
import { LOCATIONS } from "@/lib/locations";
import { naverPlaceUrl, STORES } from "@/lib/stores";
import { heroImage, openStatus, todayHoursText } from "./StoreHelpers";
import styles from "./HomeStores.module.css";

/** 참여 매장 — 매장당 한 블록(사진 + 이름 + 대표 술 + 오늘 영업시간 + 주소 + 지하철). 선으로만 구분. */
export function HomeStores() {
  const now = new Date();
  return (
    <ol className={styles.list}>
      {STORES.map((s, i) => {
        const img = heroImage(s);
        const st = openStatus(s, now);
        const loc = LOCATIONS[s.id];
        const naver = naverPlaceUrl(s);
        return (
          <li key={s.id} className={styles.store}>
            <Link href={`/stores/${s.id}`} className={styles.photo} aria-label={`${s.shortName} 매장 정보`}>
              {img && <Image src={img.src} alt={img.alt} fill sizes="(min-width: 760px) 360px, 100vw" className={styles.img} />}
            </Link>
            <div className={styles.body}>
              <p className={styles.kicker}>{i + 1}. {s.drink}</p>
              <h3 className={styles.name}>
                <Link href={`/stores/${s.id}`}>{s.name}</Link>
              </h3>
              <dl className={`dl ${styles.dl}`}>
                <dt>오늘 영업</dt>
                <dd>{todayHoursText(st)}</dd>
                <dt>현재</dt>
                <dd className={st.open ? styles.open : styles.closed}>{st.text}</dd>
                <dt>주소</dt>
                <dd>{s.address}</dd>
                <dt>지하철</dt>
                <dd>{loc.subway}</dd>
                <dt>전화</dt>
                <dd>{s.phone ? <a href={`tel:${s.phone.replace(/-/g, "")}`}>{s.phone}</a> : "-"}</dd>
              </dl>
              <div className={styles.actions}>
                <Link href={`/stores/${s.id}`} className="btn btn-outline btn-sm">매장 정보</Link>
                {naver && <a href={naver} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">네이버 플레이스</a>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
