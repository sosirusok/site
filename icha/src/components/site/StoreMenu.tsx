import Image from "next/image";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

/** 처음에 보이는 줄 수. 나머지는 '메뉴 더 보기' 안에. */
const VISIBLE = 8;

function Thumb({ m }: { m: MenuItem }) {
  if (m.imagePath) return <Image src={m.imagePath} alt="" width={64} height={64} sizes="64px" className={styles.thumb} />;
  if (m.hasImageData) return <img src={menuImageUrl(m)} alt="" width={64} height={64} loading="lazy" className={styles.thumb} />;
  return null;
}

function Row({ m }: { m: MenuItem }) {
  return (
    <li className="row">
      <div className="body">
        <p className="title">{m.name}</p>
        {m.description && <p className={`sub ${styles.desc}`}>{m.description}</p>}
        <p className={`num ${styles.price}`}>
          {m.isGift ? (
            <>
              {m.price != null && <s className="strike">{formatWon(m.price)}</s>}
              <span className="tag tag-free">무료</span>
            </>
          ) : m.price != null ? (
            formatWon(m.price)
          ) : (
            <span className={styles.ask}>가격은 매장에서 확인해요</span>
          )}
        </p>
      </div>
      <Thumb m={m} />
    </li>
  );
}

/** 메뉴 — 목록 행. 증정 품목이 맨 위에 오고, 8개까지 보인 뒤 나머지는 접힌다. 값은 DB(listMenu). */
export function StoreMenu({ store, items, naverUrl }: { store: Store; items: MenuItem[]; naverUrl: string | null }) {
  if (!items.length) {
    return (
      <p className="cap">
        {store.shortName} 메뉴는 정리 중이에요.{" "}
        {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스에서 볼 수 있어요</a>}
      </p>
    );
  }
  const sorted = [...items.filter((m) => m.isGift), ...items.filter((m) => !m.isGift)];
  const head = sorted.slice(0, VISIBLE);
  const rest = sorted.slice(VISIBLE);
  return (
    <div>
      <ul>{head.map((m) => <Row key={m.id} m={m} />)}</ul>
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={`btn btn-secondary btn-block btn-sm ${styles.moreBtn}`}>메뉴 더 보기 · {rest.length}개</summary>
          <ul>{rest.map((m) => <Row key={m.id} m={m} />)}</ul>
        </details>
      )}
    </div>
  );
}
