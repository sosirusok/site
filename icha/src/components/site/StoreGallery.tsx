import Image from "next/image";
import type { Store } from "@/lib/stores";
import styles from "./StoreGallery.module.css";

const KIND_LABEL: Record<Store["images"][number]["kind"], string> = { hero: "대표", exterior: "외관", interior: "내부", food: "음식", drink: "술", menu: "메뉴판" };

/** 사진 스트립 — 가로로 넘겨 보는 실사진. 사진 비율을 살리고 높이만 맞춘다. */
export function StoreGallery({ store }: { store: Store }) {
  const photos = store.images.filter((i) => i.kind !== "hero");
  if (!photos.length) return null;
  return (
    <div className={styles.strip} role="region" aria-label={`${store.shortName} 사진 ${photos.length}장`}>
      <ul className={styles.track}>
        {photos.map((p, i) => (
          <li key={p.src} className={styles.item}>
            <figure className={styles.fig}>
              <div className={styles.photo}>
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 760px) 420px, 78vw" className={styles.img} />
              </div>
              <figcaption className={styles.cap}>
                <span className={styles.kind}>{KIND_LABEL[p.kind]}</span>
                <span className={styles.idx}>{i + 1}/{photos.length}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
