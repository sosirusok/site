import Image from "next/image";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import type { Store } from "@/lib/stores";
import { josa } from "./StoreHelpers";
import styles from "./StoreMenu.module.css";

function Photo({ item, sizes, className }: { item: MenuItem; sizes: string; className?: string }) {
  if (item.imagePath) return <Image src={item.imagePath} alt={item.name} fill sizes={sizes} className={className} />;
  if (item.hasImageData) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/menu-image/${item.id}`} alt={item.name} loading="lazy" className={className} />;
  }
  return null;
}

const SHOW_FIRST = 14;

/**
 * 메뉴 — 위에 '다른 매장 영수증으로 무료' 사진 격자, 아래 전체 메뉴(촘촘한 표).
 * 데이터는 DB(listMenu). 사진은 있을 때만.
 */
export function StoreMenu({ store, items, others, naverUrl, menuBoards }: {
  store: Store;
  items: MenuItem[];
  others: Store[];
  naverUrl: string | null;
  menuBoards: Store["images"];
}) {
  if (!items.length) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>메뉴 정리 중</p>
        <p>{store.shortName} 메뉴를 정리하고 있어요.{naverUrl ? " 그동안은 네이버 플레이스에서 볼 수 있어요." : ""}</p>
        {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스 메뉴 ↗</a>}
      </div>
    );
  }
  const gifts = items.filter((m) => m.isGift);
  const head = items.slice(0, SHOW_FIRST);
  const rest = items.slice(SHOW_FIRST);
  const otherNames = others.map((s, i) => (i < others.length - 1 ? josa(s.shortName, "이나") : s.shortName)).join(" ");
  const giftPhotos = gifts.filter((m) => m.imagePath || m.hasImageData);
  const giftPlain = gifts.filter((m) => !(m.imagePath || m.hasImageData));

  const Row = ({ m }: { m: MenuItem }) => (
    <li className={`${styles.row} ${m.imagePath || m.hasImageData ? "" : styles.noThumb}`}>
      {(m.imagePath || m.hasImageData) && (
        <span className={styles.thumb}><Photo item={m} sizes="56px" className={styles.thumbImg} /></span>
      )}
      <span className={styles.rowBody}>
        <span className={styles.rowName}>
          {m.name}
          {m.isGift && <span className={styles.giftMark}>무료 사이드</span>}
        </span>
        {m.description && <span className={styles.rowDesc}>{m.description}</span>}
      </span>
      <span className={`num ${styles.rowPrice}`}>{m.price != null ? formatWon(m.price) : "매장 문의"}</span>
    </li>
  );

  return (
    <div className={styles.root}>
      {gifts.length > 0 && (
        <section className={styles.gift} aria-labelledby="gift-title">
          <header className={styles.giftHead}>
            <h3 id="gift-title" className={styles.giftTitle}>
              <em>{otherNames}</em> 영수증이면<br />이 중 하나가 <em>무료</em>
            </h3>
            <p className={styles.giftSub}>{gifts.length}가지 · 영수증 한 장에 한 접시 · 매장 사정에 따라 바뀔 수 있어요</p>
          </header>
          {giftPhotos.length > 0 && (
            <ul className={styles.giftGrid}>
              {giftPhotos.map((m) => (
                <li key={m.id} className={styles.giftItem}>
                  <div className={styles.giftPhoto}>
                    <Photo item={m} sizes="(min-width: 1000px) 20vw, (min-width: 760px) 33vw, 50vw" className={styles.giftImg} />
                    <span className={styles.free}>무료</span>
                  </div>
                  <p className={styles.giftName}>{m.name}</p>
                  <p className={styles.giftPrice}>{m.price != null && <s>{formatWon(m.price)}</s>}<b>0원</b></p>
                </li>
              ))}
            </ul>
          )}
          {giftPlain.length > 0 && (
            <ul className={styles.giftPlain} aria-label="사진 없는 무료 사이드">
              {giftPlain.map((m) => (
                <li key={m.id} className={styles.giftPlainItem}>
                  <span className={styles.free}>무료</span>
                  <span className={styles.giftPlainName}>{m.name}{m.description && <small>{m.description}</small>}</span>
                  <span className={styles.giftPrice}>{m.price != null && <s>{formatWon(m.price)}</s>}<b>0원</b></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="all-menu-title" className={styles.all}>
        <header className={styles.allHead}>
          <h3 id="all-menu-title" className={styles.allTitle}>전체 메뉴 <span className="num">{items.length}</span></h3>
          <p className={styles.allSub}>가격은 매장 메뉴판 기준이며 바뀔 수 있어요.</p>
        </header>
        <ul className={styles.list}>{head.map((m) => <Row key={m.id} m={m} />)}</ul>
        {rest.length > 0 && (
          <details className={styles.more}>
            <summary className={styles.moreBtn}>나머지 {rest.length}개 더 보기</summary>
            <ul className={styles.list}>{rest.map((m) => <Row key={m.id} m={m} />)}</ul>
          </details>
        )}
        {menuBoards.length > 0 && (
          <div className={styles.boards}>
            <p className={styles.boardsLabel}>매장 메뉴판 사진</p>
            <ul className={styles.boardList}>
              {menuBoards.map((b) => (
                <li key={b.src}>
                  <a href={b.src} target="_blank" rel="noreferrer" className={styles.board}>
                    <Image src={b.src} alt={b.alt} fill sizes="(min-width: 760px) 300px, 45vw" className={styles.boardImg} />
                  </a>
                  <p className={styles.boardCap}>{b.alt}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스 메뉴 ↗</a>}
      </section>
    </div>
  );
}
