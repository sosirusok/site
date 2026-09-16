import Image from "next/image";
import Link from "next/link";
import { STORES, type Store } from "@/lib/stores";
import { heroImage, openStatus, todayHoursText } from "./StoreHelpers";
import styles from "./StoreHero.module.css";

/** 매장 상세 상단 — 전체 폭 실사진(사각), 그 아래 이름·대표 술·오늘 영업시간과 영수증/쿠폰 바로가기. */
export function StoreHero({ store }: { store: Store }) {
  const img = heroImage(store);
  const st = openStatus(store);
  const num = STORES.findIndex((s) => s.id === store.id) + 1;

  return (
    <header className={styles.hero}>
      {img && (
        <div className={styles.photo}>
          <Image src={img.src} alt={img.alt} fill priority sizes="100vw" className={styles.img} />
        </div>
      )}
      <div className={`wrap ${styles.inner}`}>
        <p className={styles.crumb}>
          <Link href="/#stores">참여 매장</Link>
          <span aria-hidden="true"> / </span>
          <span>{num}. {store.shortName}</span>
        </p>
        <h1 className={`h1 ${styles.name}`}>{store.name}</h1>
        <dl className={`dl ${styles.meta}`}>
          <dt>대표 술</dt>
          <dd>{store.drink}</dd>
          <dt>오늘 영업</dt>
          <dd>{todayHoursText(st)}</dd>
          <dt>현재</dt>
          <dd className={st.open ? styles.open : styles.closed}>{st.text}</dd>
        </dl>
        <ul className={styles.quick}>
          <li>
            <Link href={`/verify?from=${store.id}`}>
              <span>이 매장 영수증이 있습니까?</span>
              <b>영수증 인증 →</b>
            </Link>
          </li>
          <li>
            <Link href="/wallet">
              <span>이 매장에서 쓸 쿠폰이 있습니까?</span>
              <b>쿠폰함 →</b>
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
