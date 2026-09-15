import Link from "next/link";
import { STORES, type Store } from "@/lib/stores";
import { ArrowIcon, DrinkIcon, ReceiptIcon, TicketIcon } from "@/components/ui/icons";
import styles from "./StoreHero.module.css";

export function StoreHero({ store }: { store: Store }) {
  const index = STORES.findIndex((s) => s.id === store.id);
  const num = String(index + 1).padStart(2, "0");
  const total = String(STORES.length).padStart(2, "0");
  return (
    <section data-store={store.id} className={styles.hero} aria-labelledby="store-title">
      <div className={`wrap ${styles.inner}`}>
        <p className={`mono ${styles.eyebrow}`}>
          <span className={styles.num}>{num} / {total}</span>
          <span className={styles.drink}><DrinkIcon drink={store.drink} size={18} /> {store.drink}</span>
        </p>
        <h1 id="store-title" className={`serif ${styles.name}`}>{store.shortName}</h1>
        <p className={`mono ${styles.full}`}>{store.name}</p>
        <p className={`serif ${styles.headline}`}>{store.headline}</p>

        <div className={styles.asks}>
          <Link href={`/verify?from=${store.id}`} className={`paper ${styles.ask}`}>
            <span className={styles.askIcon}><ReceiptIcon size={26} /></span>
            <span className={styles.askQ}>이 매장 영수증이 있나요?</span>
            <span className={styles.askA}>인증하고 다른 두 곳에서 사이드 고르기 <ArrowIcon size={16} /></span>
          </Link>
          <Link href="/wallet" className={`paper ${styles.ask}`}>
            <span className={styles.askIcon}><TicketIcon size={26} /></span>
            <span className={styles.askQ}>이 매장에서 쓸 쿠폰이 있나요?</span>
            <span className={styles.askA}>쿠폰함 열기 <ArrowIcon size={16} /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}
