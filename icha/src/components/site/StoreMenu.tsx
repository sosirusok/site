import Image from "next/image";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

/** 처음에 보이는 줄 수. 나머지는 '메뉴 더 보기' 안에. */
const VISIBLE = 8;

/** 메뉴 실사진이 있으면 56px 썸네일, 없으면 아무것도 그리지 않는다. */
export function MenuThumb({ m }: { m: MenuItem }) {
  if (m.imagePath) return <Image src={m.imagePath} alt="" width={56} height={56} sizes="56px" className="thumb" />;
  if (m.hasImageData) return <Image src={menuImageUrl(m)} alt="" width={56} height={56} sizes="56px" unoptimized className="thumb" />;
  return null;
}

function Row({ m }: { m: MenuItem }) {
  return (
    <li className="row">
      <div className="body">
        <p className="title">{m.name}</p>
        {m.description && <p className={`sub ${styles.desc}`}>{m.description}</p>}
        <p className={`num ${styles.price}`}>
          {m.price != null ? formatWon(m.price) : <span className={styles.ask}>가격은 매장에서 확인해요</span>}
          {m.isGift && <span className="tag tag-store">특별 혜택</span>}
        </p>
      </div>
      <MenuThumb m={m} />
    </li>
  );
}

/** 메뉴 — 목록 행. 혜택 품목이 맨 위, 8개까지 보인 뒤 나머지는 접힘. 맨 아래 초록 버튼은 네이버 메뉴판. 값은 DB(listMenu). */
export function StoreMenu({ store, items, menuUrl }: { store: Store; items: MenuItem[]; menuUrl: string | null }) {
  const sorted = [...items.filter((m) => m.isGift), ...items.filter((m) => !m.isGift)];
  const head = sorted.slice(0, VISIBLE);
  const rest = sorted.slice(VISIBLE);
  return (
    <div className={styles.root}>
      {items.length === 0 ? (
        <p className="cap">{store.shortName} 메뉴는 정리 중이에요.</p>
      ) : (
        <>
          <ul>{head.map((m) => <Row key={m.id} m={m} />)}</ul>
          {rest.length > 0 && (
            <details className={styles.more}>
              <summary className={`btn btn-secondary btn-block ${styles.moreBtn}`}>메뉴 더 보기 · {rest.length}개</summary>
              <ul>{rest.map((m) => <Row key={m.id} m={m} />)}</ul>
            </details>
          )}
        </>
      )}
      {menuUrl && <a className={`btn btn-naver btn-sm btn-block ${styles.naver}`} href={menuUrl} target="_blank" rel="noreferrer">네이버에서 메뉴 전체 보기</a>}
    </div>
  );
}
