import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Store } from "@/lib/stores";
import { photoAlt, STORE_FAN } from "./storePhotos";
import styles from "./StoreGallery.module.css";

/**
 * 매장 사진 — 2열 격자가 아니라 옆으로 흐르는 가로 스크롤 스트립. 첫 장은 두 배 넓고(비대칭), 나머지는 3:4 세로.
 * 사진마다 Anton 번호와 한 줄 설명. 맨 아래 [사진 더 보기](네이버).
 */
export function StoreGallery({ store, photoUrl = null }: { store: Store; photoUrl?: string | null }) {
  const photos = STORE_FAN[store.id];
  if (!photos.length) return null;
  return (
    <div className={styles.root}>
      <ul className={`strip ${styles.strip}`} aria-label={`${store.shortName} 사진 ${photos.length}장`}>
        {photos.map((p, i) => (
          <li key={p.src} className={`${styles.item} ${i === 0 ? styles.wide : ""}`}>
            <figure className={styles.fig}>
              <span className={`duo duo-soft duo-food ${styles.frame}`}>
                <Image src={p.src} alt={photoAlt(store.images, p)} fill sizes={i === 0 ? "300px" : "160px"} style={{ objectPosition: p.pos }} className={styles.img} />
                <span className={styles.no} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <figcaption className={styles.cap}>{p.cap}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="strip-hint" aria-hidden="true">사진 {photos.length}장 · 옆으로 넘겨 보세요</p>
      {photoUrl && <Button href={photoUrl} variant="ghost" className={styles.more}>네이버에서 사진 더 보기</Button>}
    </div>
  );
}
