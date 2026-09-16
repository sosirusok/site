import Image from "next/image";
import { Art } from "@/components/art/Art";
import { LOCATIONS } from "@/lib/locations";
import type { Store } from "@/lib/stores";
import { STORE_COPY, heroImage, nowText, openStatus, todayShort } from "./StoreHelpers";
import styles from "./StoreHero.module.css";

/** 매장 상세 맨 위 — 사장님 배지, 이름, 한 줄 소개, 오늘 영업시간, 주소·전화, 그리고 큰 실사진 한 장. */
export function StoreHero({ store }: { store: Store }) {
  const img = heroImage(store);
  const st = openStatus(store);
  const copy = STORE_COPY[store.id];
  const loc = LOCATIONS[store.id];
  const now = nowText(st);

  return (
    <header className={styles.hero} data-store={store.id}>
      <div className={styles.badge}>
        <Art name={`badge-${store.id}`} alt="" sizes="170px" priority />
      </div>
      <h1 className={`display ${styles.name}`}>{store.name}</h1>
      <p className={styles.headline}>{copy.headline}</p>
      <p className={styles.today}>
        <span>{todayShort(st)}</span>
        {st.lastOrder && st.today !== "휴무" && <span className={styles.lo}>주문 마감 {st.lastOrder}</span>}
        {now && <b className={st.open ? styles.open : styles.closed}>{now}</b>}
      </p>
      <ul className={styles.facts}>
        <li>
          <span className={styles.k}>주소</span>
          <span>{store.address}</span>
        </li>
        <li>
          <span className={styles.k}>지하철</span>
          <span>{loc.subway} · {loc.floor}</span>
        </li>
        {store.phone && (
          <li>
            <span className={styles.k}>전화</span>
            <a href={`tel:${store.phone.replace(/-/g, "")}`} className={styles.tel}>{store.phone}</a>
          </li>
        )}
      </ul>
      {img && (
        <figure className={styles.photo}>
          <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 860px) 800px, 100vw" className={styles.img} />
        </figure>
      )}
    </header>
  );
}
