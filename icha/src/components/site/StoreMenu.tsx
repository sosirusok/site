import Image from "next/image";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

/** 처음에 보이는 줄 수. 나머지는 '메뉴 더 보기' 안에. */
const VISIBLE = 8;

/** 메뉴 사진 — 배경을 뺀 PNG(도쿄스탠드)는 종이 위에 그대로, 사진(JPG)은 작은 폴라로이드처럼 흰 테두리. 없으면 아무것도 안 그린다. */
export function MenuThumb({ m, size = 60 }: { m: MenuItem; size?: number }) {
  if (m.imagePath) {
    const cut = /\.png$/i.test(m.imagePath);
    return <Image src={m.imagePath} alt="" width={size} height={size} sizes={`${size}px`} className={cut ? styles.cut : styles.photo} style={{ width: size, height: size }} />;
  }
  if (m.hasImageData) return <Image src={menuImageUrl(m)} alt="" width={size} height={size} sizes={`${size}px`} unoptimized className={styles.photo} style={{ width: size, height: size }} />;
  return null;
}

function Row({ m }: { m: MenuItem }) {
  return (
    <li className={styles.item}>
      <MenuThumb m={m} />
      <div className={styles.body}>
        <p className={styles.name}>
          {m.name}
          {m.isGift && <span className={`tag tag-free ${styles.giftTag}`}>특별 혜택</span>}
        </p>
        {m.description && <p className={styles.desc}>{m.description}</p>}
      </div>
      <p className={`disp num ${styles.price}`}>{m.price != null ? formatWon(m.price) : <span className={styles.ask}>매장 확인</span>}</p>
    </li>
  );
}

/** 메뉴판 — 크림 종이 한 장. 혜택 품목이 맨 위, 8개까지 보인 뒤 나머지는 접힘. 값은 Do Hyeon, 사진은 잘라 낸 PNG. 값은 DB(listMenu). */
export function StoreMenu({ store, items, menuUrl }: { store: Store; items: MenuItem[]; menuUrl: string | null }) {
  const sorted = [...items.filter((m) => m.isGift), ...items.filter((m) => !m.isGift)];
  const head = sorted.slice(0, VISIBLE);
  const rest = sorted.slice(VISIBLE);
  return (
    <div className={`paper paper-l ${styles.board}`}>
      <p className={styles.head}>
        <span className="plate plate-red plate-sm">MENU</span>
        <span className={`hand ${styles.headHand}`}>{store.shortName} 메뉴판</span>
      </p>
      {items.length === 0 ? (
        <p className={`hand ${styles.empty}`}>{store.shortName} 메뉴는 정리 중이에요.</p>
      ) : (
        <>
          <ul className={styles.list}>{head.map((m) => <Row key={m.id} m={m} />)}</ul>
          {rest.length > 0 && (
            <details className={styles.more}>
              <summary className={`btn btn-secondary btn-sm btn-block btn-0 ${styles.moreBtn}`}>메뉴 더 보기 · {rest.length}개</summary>
              <ul className={styles.list}>{rest.map((m) => <Row key={m.id} m={m} />)}</ul>
            </details>
          )}
        </>
      )}
      {menuUrl && <a className={`link ${styles.naver}`} href={menuUrl} target="_blank" rel="noreferrer">네이버에서 메뉴 전체 보기</a>}
    </div>
  );
}
