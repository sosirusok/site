import Image from "next/image";
import type { CSSProperties } from "react";
import type { Store } from "@/lib/stores";
import { StickerButton } from "./Kit";
import { capParts, photoAlt, STORE_FAN } from "./storePhotos";
import styles from "./StoreGallery.module.css";

const R = [-1, 2, -2, 3, -3] as const;

/**
 * 매장 사진 다섯 장(폴라로이드, 캡션 있음) — 벽에 핀으로 꽂은 사진처럼 서로 덮지 않는다(캡션이 가려지면 안 되므로).
 *   1줄: [0] 대표 안주 한 단 가득(344px 사진)   2줄: [1] 큰 카드 60% + [3] 매장 안 작은 카드 40%   3줄: [2] 큰 카드 60%(오른쪽) + [4] 매장 입구 작은 카드 40%(왼쪽)
 * 큰 카드는 캡션(최장 191px)이 한 줄에 들어가는 폭, 작은 카드는 캡션이 짧은 장소 사진만. 맨 아래 오른쪽에 키트 [사진 더 보기](네이버).
 */
export function StoreGallery({ store, photoUrl = null }: { store: Store; photoUrl?: string | null }) {
  const photos = STORE_FAN[store.id];
  if (!photos.length) return null;
  return (
    <div className={styles.root}>
      <ul className={styles.wall} aria-label={`${store.shortName} 사진 ${photos.length}장`}>
        {photos.map((p, i) => {
          const [capName, capPrice] = capParts(p.cap);
          return (
            <li key={p.src} className={`pola ${styles.pola} ${styles[`g${i}`]}`} style={{ "--r": `${R[i]}deg` } as CSSProperties}>
              <Image src={p.src} alt={photoAlt(store.images, p)} width={i === 0 ? 720 : 480} height={i === 0 ? 540 : 360} sizes={i === 0 ? "(min-width: 480px) 448px, 100vw" : i === 1 || i === 2 ? "220px" : "140px"} priority={i < 2} style={{ objectPosition: p.pos }} />
              <span className="cap">{capName}{capPrice && <> <span className="cap-price">{capPrice}</span></>}</span>
            </li>
          );
        })}
      </ul>
      {photoUrl && <StickerButton kind="morephoto" size="sm" tilt={1} secondary href={photoUrl} className={styles.more}>사진 더 보기</StickerButton>}
    </div>
  );
}
