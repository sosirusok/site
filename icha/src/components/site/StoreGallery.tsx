import Image from "next/image";
import type { Store } from "@/lib/stores";
import styles from "./StoreGallery.module.css";

/** 사진 격자 — 대표 사진을 뺀 나머지를 3열 정사각으로. 설명은 alt 로만. */
export function StoreGallery({ store }: { store: Store }) {
  const photos = store.images.filter((i) => i.kind !== "hero");
  if (!photos.length) return null;
  return (
    <ul className={styles.grid} aria-label={`${store.shortName} 사진 ${photos.length}장`}>
      {photos.map((p) => (
        <li key={p.src} className={styles.cell}>
          <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1120px) 360px, 33vw" className={styles.img} />
        </li>
      ))}
    </ul>
  );
}
