import { menuImageUrl } from "@/lib/menu-image";
import Image from "next/image";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import type { Store } from "@/lib/stores";
import { joinOr } from "./StoreHelpers";
import styles from "./StoreMenu.module.css";

function Photo({ item }: { item: MenuItem }) {
  if (item.imagePath) return <Image src={item.imagePath} alt="" fill sizes="56px" className={styles.thumbImg} />;
  if (item.hasImageData) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={menuImageUrl(item)} alt="" loading="lazy" className={styles.thumbImg} />;
  }
  return null;
}

const SHOW_FIRST = 24;

/**
 * 메뉴 — 한 표. 무료 사이드 대상(isGift)은 '무료 사이드' 로 표시. 데이터는 DB(listMenu).
 * 메뉴 설명(description)은 조사 메모가 섞여 있어 정리될 때까지 보이지 않는다.
 */
export function StoreMenu({ store, items, others, naverUrl }: { store: Store; items: MenuItem[]; others: Store[]; naverUrl: string | null }) {
  if (!items.length) {
    return (
      <p className={styles.empty}>
        {store.shortName} 메뉴를 정리 중입니다.{" "}
        {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스에서 메뉴 보기</a>}
      </p>
    );
  }
  const giftCount = items.filter((m) => m.isGift).length;
  const head = items.slice(0, SHOW_FIRST);
  const rest = items.slice(SHOW_FIRST);
  const otherNames = joinOr(others.map((s) => s.shortName));

  const Row = ({ m }: { m: MenuItem }) => {
    const hasPhoto = Boolean(m.imagePath || m.hasImageData);
    return (
      <tr>
        <td>
          <span className={styles.cell}>
            {hasPhoto && <span className={styles.thumb}><Photo item={m} /></span>}
            <span className={styles.name}>
              {m.name}
              {m.isGift && <span className={styles.giftMark}>무료 사이드</span>}
            </span>
          </span>
        </td>
        <td className={styles.price}>{m.price != null ? formatWon(m.price) : "매장 문의"}</td>
      </tr>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.notes}>
        {giftCount > 0 && (
          <p className={styles.note}>
            <span className={styles.giftMark}>무료 사이드</span> 표시가 있는 {giftCount}개 메뉴는 {otherNames} 영수증 인증 시 무료로 제공됩니다. {store.shortName} 영수증으로는 받을 수 없습니다.
          </p>
        )}
        <p className={styles.small}>가격은 매장 메뉴판 기준이며 바뀔 수 있습니다. 메뉴 {items.length}개.</p>
      </div>
      <table className={`table ${styles.table}`}>
        <thead>
          <tr>
            <th scope="col">메뉴</th>
            <th scope="col" className={styles.thPrice}>가격</th>
          </tr>
        </thead>
        <tbody>{head.map((m) => <Row key={m.id} m={m} />)}</tbody>
      </table>
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreBtn}>나머지 메뉴 {rest.length}개 보기</summary>
          <table className={`table ${styles.table} ${styles.tableRest}`}>
            <tbody>{rest.map((m) => <Row key={m.id} m={m} />)}</tbody>
          </table>
        </details>
      )}
      {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스에서 메뉴 보기</a>}
    </div>
  );
}
