import Image from "next/image";
import { Art } from "@/components/art/Art";
import type { Store } from "@/lib/stores";
import { STORE_COPY, heroImage, openStatus, todayShort } from "./StoreHelpers";
import styles from "./StoreHero.module.css";

/** 매장 상세 맨 위 — 배지, 이름, 한 줄, 오늘 영업시간·상태, 주소·전화, 실사진 한 장. */
export function StoreHero({ store }: { store: Store }) {
  const img = heroImage(store);
  const st = openStatus(store);
  const state = st.open ? "영업 중" : st.today === "휴무" ? "" : /오픈 예정/.test(st.text) ? "준비 중" : "영업 종료";

  return (
    <header className={styles.hero} data-store={store.id}>
      <div className={styles.badge}>
        <Art name={`badge-${store.id}`} alt="" sizes="140px" priority />
      </div>
      <h1 className={`display ${styles.name}`}>{store.name}</h1>
      <p className={styles.headline}>{STORE_COPY[store.id].headline}</p>
      <p className={styles.today}>
        <span>{todayShort(st)}</span>
        {state && <b className={st.open ? styles.open : styles.closed}>· {state}</b>}
      </p>
      <p className={styles.fact}>
        <span className={styles.k}>주소</span>
        <span>{store.address}</span>
      </p>
      {store.phone && (
        <p className={styles.fact}>
          <span className={styles.k}>전화</span>
          <a href={`tel:${store.phone.replace(/-/g, "")}`} className={styles.tel}>{store.phone}</a>
        </p>
      )}
      {img && (
        <figure className={styles.photo}>
          <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 860px) 800px, 100vw" className={styles.img} />
        </figure>
      )}
    </header>
  );
}
