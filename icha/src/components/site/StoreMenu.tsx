import Image from "next/image";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import type { Store } from "@/lib/stores";
import { joinOr, josa } from "./StoreHelpers";
import styles from "./StoreMenu.module.css";

const SHOW_FIRST = 24;
const THUMBS = 6;

function hasPhoto(m: MenuItem): boolean {
  return Boolean(m.imagePath || m.hasImageData);
}

function Photo({ item, sizes }: { item: MenuItem; sizes: string }) {
  if (item.imagePath) return <Image src={item.imagePath} alt="" fill sizes={sizes} className={styles.photo} />;
  // 관리자가 올린 사진은 DB 에서 나오므로 next/image 를 쓰지 않는다.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={menuImageUrl(item)} alt="" loading="lazy" className={styles.photo} />;
}

function Row({ m }: { m: MenuItem }) {
  return (
    <li className={`${styles.row} ${m.isGift ? styles.rowGift : ""}`}>
      <span className={styles.rowName}>{m.name}</span>
      <span className={styles.dots} aria-hidden="true" />
      <span className={styles.price}>
        {m.isGift ? (
          <>
            {m.price != null && <s>{formatWon(m.price)}</s>}
            <span className="tag tag-free">무료 증정</span>
          </>
        ) : m.price != null ? (
          formatWon(m.price)
        ) : (
          <span className={styles.ask}>매장에서 확인</span>
        )}
      </span>
    </li>
  );
}

/**
 * 메뉴판 — 사진 있는 메뉴 몇 개는 위에 작은 격자로, 전체는 점선 이음줄 목록으로.
 * 증정 품목(isGift)은 '무료 증정' 으로 표시한다. 데이터는 DB(listMenu) — 관리자가 바꾼 값이 그대로 나온다.
 */
export function StoreMenu({ store, items, others, naverUrl }: { store: Store; items: MenuItem[]; others: Store[]; naverUrl: string | null }) {
  if (!items.length) {
    return (
      <p className={styles.empty}>
        {store.shortName} 메뉴는 아직 정리 중이에요.{" "}
        {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스에서 볼 수 있어요</a>}
      </p>
    );
  }
  const gifts = items.filter((m) => m.isGift);
  // 같은 사진을 쓰는 메뉴(콜드햄 플레이트 세 종류 등)는 한 번만
  const seen = new Set<string>();
  const thumbs = items.filter((m) => {
    if (!hasPhoto(m) || m.isGift) return false;
    const key = m.imagePath ?? `db:${m.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, THUMBS);
  // 증정 품목은 맨 위에 — '더 보기' 안에 숨지 않게
  const ordered = [...gifts, ...items.filter((m) => !m.isGift)];
  const head = ordered.slice(0, SHOW_FIRST);
  const rest = ordered.slice(SHOW_FIRST);
  const otherNames = joinOr(others.map((s) => s.shortName));

  return (
    <div className={styles.root}>
      {thumbs.length > 0 && (
        <ul className={styles.thumbs} aria-label="사진이 있는 메뉴">
          {thumbs.map((m) => (
            <li key={m.id} className={styles.thumb}>
              <span className={styles.thumbBox}><Photo item={m} sizes="(min-width: 860px) 250px, 30vw" /></span>
              <span className={styles.thumbName}>{m.name}</span>
              <span className={styles.thumbPrice}>{m.price != null ? formatWon(m.price) : "매장에서 확인"}</span>
            </li>
          ))}
        </ul>
      )}

      <ol className={styles.list}>
        {head.map((m) => <Row key={m.id} m={m} />)}
      </ol>
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreBtn}>메뉴 더 보기 · {rest.length}개</summary>
          <ol className={styles.list}>
            {rest.map((m) => <Row key={m.id} m={m} />)}
          </ol>
        </details>
      )}

      <p className={styles.note}>
        {gifts.length > 0 ? (
          <>
            <span className="tag tag-free">무료 증정</span> 표시가 있는 {josa(gifts.map((g) => g.name).join(", "), "은는")} {otherNames} 영수증을 올린 손님에게 무료로 드려요.{" "}
          </>
        ) : null}
        가격은 매장 메뉴판을 옮긴 것이라 조금 바뀌어 있을 수 있어요.
      </p>
    </div>
  );
}
