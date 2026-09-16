import Image from "next/image";
import type { Store, StoreImage } from "@/lib/stores";
import styles from "./StoreGallery.module.css";

/** 외관 → 내부 → 음식 → 술 순으로 일곱 장. 맨 위 사진(hero)은 이미 첫 화면에 크게 있어서 뺀다. */
function stripPhotos(store: Pick<Store, "images">, max = 7): StoreImage[] {
  const order: StoreImage["kind"][] = ["exterior", "interior", "food", "drink"];
  return order.flatMap((k) => store.images.filter((i) => i.kind === k)).slice(0, max);
}

/** 매장 사진 띠 — 옆으로 넘겨 보는 실사진. 맨 끝 장은 네이버 사진으로 가는 칸(그 집 색 테두리). */
export function StoreGallery({ store, photoUrl = null }: { store: Store; photoUrl?: string | null }) {
  const photos = stripPhotos(store);
  if (!photos.length) return null;
  return (
    <ul className={`strip ${styles.strip}`} aria-label={`${store.shortName} 사진 ${photos.length}장`}>
      {photos.map((p, i) => (
        <li key={p.src} className={styles.cell}>
          <Image src={p.src} alt={p.alt} fill sizes="(min-width: 480px) 360px, 74vw" priority={i === 0} className={styles.img} />
          <span className={styles.shade} aria-hidden="true" />
        </li>
      ))}
      {photoUrl && (
        <li className={styles.cell}>
          <a className={styles.more} href={photoUrl} target="_blank" rel="noreferrer">
            <span className={styles.moreText}>네이버에서<br />사진 더 보기</span>
          </a>
        </li>
      )}
    </ul>
  );
}
