import Image from "next/image";
import type { Store } from "@/lib/stores";
import { STORE_COPY, gridPhotos } from "./StoreHelpers";
import styles from "./StoreGallery.module.css";

/** 매장 사진 — 대표 사진을 뺀 나머지를 정사각으로 잘라 2열(데스크톱 3열)로. 설명은 alt 로만 두고, 위에 한 줄. */
export function StoreGallery({ store }: { store: Store }) {
  const photos = gridPhotos(store, 12);
  if (!photos.length) return null;
  return (
    <div className={styles.root}>
      <p className={styles.note}>{STORE_COPY[store.id].photoNote}</p>
      <ul className={styles.grid} aria-label={`${store.shortName} 사진 ${photos.length}장`}>
        {photos.map((p, i) => (
          <li key={p.src} className={`${styles.cell} rise rise-d${(i % 2) + 1}`}>
            <Image src={p.src} alt={p.alt} fill sizes="(min-width: 860px) 260px, 45vw" className={styles.img} />
          </li>
        ))}
      </ul>
    </div>
  );
}
