import { menuImageUrl } from "@/lib/menu-image";
import Image from "next/image";
import Link from "next/link";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import type { Store } from "@/lib/stores";
import styles from "./HomeGifts.module.css";

export type GiftGroup = { store: Store; items: MenuItem[] };

function Photo({ item }: { item: MenuItem }) {
  if (item.imagePath) return <Image src={item.imagePath} alt="" fill sizes="56px" className={styles.thumbImg} />;
  if (item.hasImageData) {
    // DB 에 올린 사진은 next/image 대신 일반 img
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={menuImageUrl(item)} alt="" loading="lazy" className={styles.thumbImg} />;
  }
  return null;
}

/** 무료 사이드 메뉴 — 매장별 표(썸네일·메뉴명·정가 취소선·무료). 사진 없는 항목도 표에 넣는다. */
export function HomeGifts({ groups }: { groups: GiftGroup[] }) {
  return (
    <div className={styles.root}>
      {groups.map((g, gi) => (
        <section key={g.store.id} className={styles.group} aria-labelledby={`gift-${g.store.id}`}>
          <div className={styles.head}>
            <h3 id={`gift-${g.store.id}`} className={styles.storeName}>
              {gi + 1}. {g.store.shortName} <span className={styles.count}>{g.items.length}종</span>
            </h3>
            <Link href={`/stores/${g.store.id}#menu`} className={styles.more}>전체 메뉴</Link>
          </div>
          {g.items.length > 0 ? (
            <table className={`table ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col">메뉴</th>
                  <th scope="col" className={styles.thPrice}>정가</th>
                  <th scope="col" className={styles.thFree}>혜택</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((m) => {
                  const hasPhoto = Boolean(m.imagePath || m.hasImageData);
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className={styles.cell}>
                          {hasPhoto && <span className={styles.thumb}><Photo item={m} /></span>}
                          <span className={styles.name}>{m.name}</span>
                        </span>
                      </td>
                      <td className={styles.price}>{m.price != null ? <s>{formatWon(m.price)}</s> : "매장 문의"}</td>
                      <td className={styles.free}>무료</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>무료 사이드 메뉴를 정리 중입니다.</p>
          )}
        </section>
      ))}
    </div>
  );
}
