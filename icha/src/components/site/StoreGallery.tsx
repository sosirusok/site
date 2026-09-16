import Image from "next/image";
import type { CSSProperties } from "react";
import type { Store } from "@/lib/stores";
import { STORE_FAN } from "./storePhotos";
import styles from "./StoreGallery.module.css";

const R = [-4, 3, 3, -3, 4] as const;

/** 가게 사진 다섯 장 — 큰 폴라로이드 둘 위에 작은 셋이 겹쳐 붙는다. 맨 아래는 네이버 사진으로 가는 작은 글자. */
export function StoreGallery({ store, photoUrl = null }: { store: Store; photoUrl?: string | null }) {
  const photos = STORE_FAN[store.id];
  if (!photos.length) return null;
  return (
    <div className={styles.root}>
      <ul className={styles.fan} aria-label={`${store.shortName} 사진 ${photos.length}장`}>
        {photos.map((p, i) => {
          const alt = store.images.find((im) => im.src === p.src)?.alt ?? `${store.shortName} ${p.cap}`;
          return (
            <li key={p.src} className={`pola ${styles.pola} ${styles[`g${i}`]}`} style={{ "--r": `${R[i]}deg` } as CSSProperties}>
              <Image src={p.src} alt={alt} width={360} height={360} sizes="(min-width: 480px) 240px, 50vw" priority={i < 2} style={p.pos ? { objectPosition: p.pos } : undefined} />
              <span className="cap" aria-hidden="true">{p.cap}</span>
            </li>
          );
        })}
      </ul>
      {photoUrl && <a className={`link link-w ${styles.more}`} href={photoUrl} target="_blank" rel="noreferrer">네이버에서 사진 더 보기</a>}
    </div>
  );
}
