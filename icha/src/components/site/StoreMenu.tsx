import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

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
 * 메뉴판 — 증정 품목은 맨 위에 보이고, 나머지는 접힌 '메뉴 전체 보기' 안에.
 * 데이터는 DB(listMenu) — 관리자가 바꾼 값이 그대로 나온다.
 */
export function StoreMenu({ store, items, naverUrl }: { store: Store; items: MenuItem[]; naverUrl: string | null }) {
  if (!items.length) {
    return (
      <p className={styles.empty}>
        {store.shortName} 메뉴는 정리 중이에요.{" "}
        {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스에서 볼 수 있어요</a>}
      </p>
    );
  }
  const gifts = items.filter((m) => m.isGift);
  const rest = items.filter((m) => !m.isGift);

  return (
    <div className={styles.root}>
      {gifts.length > 0 && (
        <ol className={styles.list}>
          {gifts.map((m) => <Row key={m.id} m={m} />)}
        </ol>
      )}
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreBtn}>메뉴 전체 보기 · {rest.length}개</summary>
          <ol className={styles.list}>
            {rest.map((m) => <Row key={m.id} m={m} />)}
          </ol>
        </details>
      )}
    </div>
  );
}
