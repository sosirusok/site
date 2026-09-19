import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Store } from "@/lib/stores";
import { photoAlt, STORE_FAN } from "./storePhotos";
import styles from "./StoreGallery.module.css";

/** 매장 사진 다섯 장 — 첫 장은 두 칸 가득(16:10), 나머지 넷은 2열(4:3). 사진 아래 짧은 설명 한 줄. 맨 아래 [사진 더 보기](네이버). */
export function StoreGallery({ store, photoUrl = null }: { store: Store; photoUrl?: string | null }) {
  const photos = STORE_FAN[store.id];
  if (!photos.length) return null;
  return (
    <div className={styles.root}>
      <ul className={styles.grid} aria-label={`${store.shortName} 사진 ${photos.length}장`}>
        {photos.map((p, i) => (
          <li key={p.src} className={`${styles.item} ${i === 0 ? styles.wide : ""}`}>
            <figure>
              <div className={styles.frame}>
                <Image src={p.src} alt={photoAlt(store.images, p)} fill sizes={i === 0 ? "(min-width: 480px) 440px, calc(100vw - 40px)" : "(min-width: 480px) 216px, calc(50vw - 24px)"} style={{ objectPosition: p.pos }} className={styles.img} />
              </div>
              <figcaption className={`small ${styles.cap}`}>{p.cap}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {photoUrl && <Button href={photoUrl} variant="outline" block className={styles.more}>네이버에서 사진 더 보기</Button>}
    </div>
  );
}
