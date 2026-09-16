import Link from "next/link";
import { Art } from "@/components/art/Art";
import { openStatus, todayShort } from "@/components/site/StoreHelpers";
import { LOCATIONS } from "@/lib/locations";
import { STORES } from "@/lib/stores";
import styles from "./Stores.module.css";

/** 세 집: 배지(매장 링크) + 술·오늘 영업시간·출구 한 줄 */
export function Stores() {
  return (
    <section id="stores" className={`section ${styles.section}`} aria-labelledby="stores-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-store" width={36} />
          <h2 id="stores-title" className="h2">세 집</h2>
        </div>
        <ul className={styles.list}>
          {STORES.map((s) => {
            const loc = LOCATIONS[s.id];
            return (
              <li key={s.id} className={styles.item} data-store={s.id}>
                <Link href={`/stores/${s.id}`} className={styles.badge}>
                  <Art name={`badge-${s.id}`} alt={s.shortName} width={130} />
                </Link>
                <p className={styles.line}>
                  <span>{s.drink} · 서면역 {loc.exit}번 출구 {loc.walkMin}분</span>
                  <span className={styles.sep}> · </span>
                  <span>{todayShort(openStatus(s))}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
