import Image from "next/image";
import { formatWon } from "@/lib/config";
import { StickerButton } from "./Kit";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

/** 처음에 보이는 줄 수. 나머지는 '메뉴 더보기' 안에. */
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

/** 메뉴판 — 크림 종이 한 장(메뉴는 종이니까), 위 가장자리 가운데 테이프, −0.8°. 머리는 '{매장} 메뉴판 · N개' 한 줄(키트 제목판 [메뉴]가 바로 위에 있으니 판을 또 두지 않는다). 혜택 품목이 맨 위, 8개까지 보인 뒤 나머지는 접힘(밑줄 글자 줄 — 종이 안의 버튼은 키트 스티커 하나뿐). 맨 아래 오른쪽에 키트 [메뉴 전체 보기](네이버). 값은 DB(listMenu). */
export function StoreMenu({ store, items, menuUrl }: { store: Store; items: MenuItem[]; menuUrl: string | null }) {
  const sorted = [...items.filter((m) => m.isGift), ...items.filter((m) => !m.isGift)];
  const head = sorted.slice(0, VISIBLE);
  const rest = sorted.slice(VISIBLE);
  return (
    <div className={`paper tape ${styles.board}`}>
      <p className={styles.head}>
        <span className={`disp ${styles.headText}`}>{store.shortName} 메뉴판{items.length > 0 ? ` · ${items.length}개` : " · 준비 중"}</span>
      </p>
      {items.length === 0 ? (
        <p className={styles.empty}>메뉴 준비 중</p>
      ) : (
        <>
          <ul className={styles.list}>{head.map((m) => <Row key={m.id} m={m} />)}</ul>
          {rest.length > 0 && (
            <details className={styles.more}>
              <summary className={`btn-text ${styles.moreBtn}`}>메뉴 더보기 · {rest.length}개 <span className={styles.moreArrow} aria-hidden="true">▾</span></summary>
              <ul className={styles.list}>{rest.map((m) => <Row key={m.id} m={m} />)}</ul>
            </details>
          )}
        </>
      )}
      {menuUrl && <StickerButton kind="moremenu" size="sm" tilt={0} secondary href={menuUrl} className={styles.naver}>메뉴 전체 보기</StickerButton>}
    </div>
  );
}
