import Image from "next/image";
import Link from "next/link";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import type { Store } from "@/lib/stores";
import styles from "./HomeGifts.module.css";

export type GiftGroup = { store: Store; items: MenuItem[] };

function Photo({ item, sizes }: { item: MenuItem; sizes: string }) {
  if (item.imagePath) return <Image src={item.imagePath} alt={item.name} fill sizes={sizes} className={styles.img} />;
  // DB 에 올린 사진은 next/image 대신 일반 img
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/menu-image/${item.id}`} alt={item.name} loading="lazy" className={styles.img} />;
}

/** 공짜로 받을 수 있는 사이드 — 매장별 가로 스크롤(모바일)/격자(데스크톱). 사진 없는 메뉴는 뺀다. */
export function HomeGifts({ groups }: { groups: GiftGroup[] }) {
  const shown = groups.map((g) => ({ ...g, items: g.items.filter((m) => m.imagePath || m.hasImageData) })).filter((g) => g.items.length > 0);
  if (!shown.length) return null;
  return (
    <div className={styles.root}>
      {shown.map((g, gi) => (
        <section key={g.store.id} className={`${styles.group} rise`} aria-labelledby={`gift-${g.store.id}`}>
          <header className={styles.head}>
            <h3 id={`gift-${g.store.id}`} className={styles.storeName}>
              <span className={styles.storeNum}>{String(gi + 1).padStart(2, "0")}</span>
              {g.store.shortName}
              <span className={styles.count}>{g.items.length}가지</span>
            </h3>
            <Link href={`/stores/${g.store.id}#menu`} className={styles.more}>메뉴 전체 보기</Link>
          </header>
          <ul className={styles.row}>
            {g.items.map((m) => (
              <li key={m.id} className={styles.item}>
                <div className={styles.photo}>
                  <Photo item={m} sizes="(min-width: 1000px) 20vw, (min-width: 760px) 33vw, 62vw" />
                  <span className={styles.free}>무료</span>
                </div>
                <p className={styles.name}>{m.name}</p>
                <p className={styles.price}>
                  {m.price != null && <s className="num">{formatWon(m.price)}</s>}
                  <b>0원</b>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
