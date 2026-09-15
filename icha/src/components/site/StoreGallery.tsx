import Image from "next/image";
import type { Store, StoreImage } from "@/lib/stores";
import { DrinkIcon } from "@/components/ui/icons";
import styles from "./StoreGallery.module.css";

const KIND_LABEL: Record<StoreImage["kind"], string> = {
  hero: "대표",
  exterior: "외관",
  interior: "내부",
  food: "음식",
  drink: "술",
  menu: "메뉴판",
};

/** 사진을 hero → 외관 → 내부 → 음식 → 술 → 메뉴판 순으로 */
export function orderedImages(store: Store): StoreImage[] {
  const rank: Record<StoreImage["kind"], number> = { hero: 0, exterior: 1, interior: 2, food: 3, drink: 4, menu: 5 };
  return [...store.images].sort((a, b) => rank[a.kind] - rank[b.kind]);
}

export function StoreGallery({ store }: { store: Store }) {
  const imgs = orderedImages(store);
  if (!imgs.length) {
    return (
      <div className={styles.empty} data-store={store.id}>
        <DrinkIcon drink={store.drink} size={72} />
        <p className={`serif ${styles.emptyName}`}>{store.shortName}</p>
        <p className={`mono ${styles.emptyNote}`}>사진 준비 중</p>
      </div>
    );
  }
  return (
    <div className={styles.root}>
      <div className={styles.scroller} tabIndex={0} aria-label={`${store.shortName} 사진 ${imgs.length}장, 옆으로 넘겨 보기`}>
        <ul className={styles.track}>
          {imgs.map((im, i) => (
            <li key={im.src} className={`${styles.slide} ${im.kind === "menu" ? styles.tall : ""}`}>
              <figure className={styles.figure}>
                <div className={styles.frame}>
                  <Image
                    src={im.src}
                    alt={im.alt}
                    fill
                    sizes="(min-width: 760px) 440px, 78vw"
                    priority={i === 0}
                    className={styles.img}
                  />
                </div>
                <figcaption className={styles.cap}>
                  <span className={`mono ${styles.kind}`}>{KIND_LABEL[im.kind]}</span>
                  <span className={styles.capText}>{im.alt}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
      <p className={`mono ${styles.count}`}>옆으로 넘겨 보세요 · {imgs.length}장</p>
    </div>
  );
}
