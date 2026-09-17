import Image from "next/image";
import type { CSSProperties } from "react";
import type { Store } from "@/lib/stores";
import { StickerButton } from "./Kit";
import { capParts, photoAlt, STORE_FAN } from "./storePhotos";
import styles from "./StoreGallery.module.css";

const R = [-1, 2, -3, 3, -3] as const;

/**
 * 매장 사진 다섯 장(폴라로이드, 캡션 있음) — 벽에 겹쳐 붙인 사진처럼 이웃을 10~20px 씩 덮는다. 캡션은 늘 드러난다:
 *   1줄 [0] 대표 안주 한 단 가득(맨 위)   2줄 [1] 큰 카드 60% · [3] 매장 안 작은 카드 40%(1줄 아래 14px 로 들어가고 [1]의 오른쪽 끝을 14px 덮는다)
 *   3줄 [4] 매장 입구 작은 카드 40% · [2] 큰 카드 60%([4]의 오른쪽 끝을 14px 덮고 2줄 아래로 14px 들어간다)
 * 덮이는 쪽은 위 줄 카드의 아래 흰 테두리·사진 모서리뿐, 캡션(카드 아래 흰 띠)은 언제나 위 카드다. 맨 아래 오른쪽에 키트 [사진 더 보기](네이버).
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
