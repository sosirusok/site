import Image from "next/image";
import Link from "next/link";
import { distanceM, SEOMYEON_STATION, walkMinutes } from "@/lib/geo";
import { STORES, type Store } from "@/lib/stores";
import { heroImage, openStatus } from "./StoreHelpers";
import styles from "./StoreHero.module.css";

/** 매장 상세 상단 — 전체 폭 실사진, 번호·이름·술·오늘 영업, 영수증/쿠폰 바로가기. */
export function StoreHero({ store }: { store: Store }) {
  const img = heroImage(store);
  const st = openStatus(store);
  const num = String(STORES.findIndex((s) => s.id === store.id) + 1).padStart(2, "0");
  const walk = store.lat != null && store.lng != null ? walkMinutes(distanceM(SEOMYEON_STATION, { lat: store.lat, lng: store.lng })) : null;

  return (
    <header className={styles.hero}>
      {img && <Image src={img.src} alt={img.alt} fill priority sizes="100vw" className={styles.img} />}
      <div className={styles.shade} aria-hidden="true" />
      <div className={`wrap ${styles.inner}`}>
        <p className={styles.crumb}>
          <Link href="/#stores">매장</Link>
          <span aria-hidden="true">/</span>
          <span>{num}</span>
        </p>
        <p className={styles.drink}>{store.drink} · {SEOMYEON_STATION.name}{walk != null ? ` 도보 ${walk}분` : ""}</p>
        <h1 className={`display ${styles.name}`}>{store.shortName}</h1>
        <p className={styles.full}>{store.name}</p>
        <p className={`lead ${styles.headline}`}>{store.headline}</p>
        <p className={`${styles.status} ${st.open ? styles.open : ""}`}>
          <span className={styles.dot} aria-hidden="true" />
          {st.text}
          <span className={styles.today}>오늘 {st.today}{st.lastOrder ? ` · 주문 마감 ${st.lastOrder}` : ""}</span>
        </p>
      </div>
      <div className={`wrap ${styles.quick}`}>
        <Link href={`/verify?from=${store.id}`} className={styles.quickItem}>
          <b>이 매장 영수증이 있나요?</b>
          <span>찍어서 올리면 나머지 두 곳 사이드 한 접시 →</span>
        </Link>
        <Link href="/wallet" className={styles.quickItem}>
          <b>이 매장에서 쓸 쿠폰이 있나요?</b>
          <span>쿠폰함을 열고 직원에게 보여 주세요 →</span>
        </Link>
      </div>
    </header>
  );
}
