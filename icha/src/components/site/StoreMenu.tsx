import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

/** 처음에 보이는 줄 수. 나머지는 '메뉴 더보기' 안에. */
const VISIBLE = 8;

/** 메뉴 사진 — 배경을 뺀 PNG 는 어두운 상자 안에 그대로, 사진(JPG)은 각진 네모로 자른다. 없으면 빈 상자. */
export function MenuThumb({ m, size = 64 }: { m: MenuItem; size?: number }) {
  const box = { width: size, height: size };
  if (m.imagePath) {
    const cut = /\.png$/i.test(m.imagePath);
    return <Image src={m.imagePath} alt="" width={size} height={size} sizes={`${size}px`} className={cut ? styles.cut : styles.photo} style={box} />;
  }
  if (m.hasImageData) return <Image src={menuImageUrl(m)} alt="" width={size} height={size} sizes={`${size}px`} unoptimized className={styles.photo} style={box} />;
  return <span className={styles.empty} style={box} aria-hidden="true" />;
}

function Row({ m }: { m: MenuItem }) {
  return (
    <li className={styles.item}>
      <MenuThumb m={m} />
      <div className={styles.body}>
        <p className={styles.name}>
          {m.name}
          {m.isGift && <span className="badge badge-brand">쿠폰 혜택</span>}
        </p>
        {m.description && <p className={styles.desc}>{m.description}</p>}
      </div>
      <p className={`price num ${styles.price}`}>{m.price != null ? formatWon(m.price) : <span className={styles.ask}>매장 확인</span>}</p>
    </li>
  );
}

/** 메뉴 — 사진 64px · 이름(혜택 품목은 라임 배지) · 설명 · 값(Anton 라임 18px). 혜택 품목이 맨 위, 8개까지 보인 뒤 나머지는 접힘. 값은 DB(listMenu). */
export function StoreMenu({ store, items, menuUrl }: { store: Store; items: MenuItem[]; menuUrl: string | null }) {
  const sorted = [...items.filter((m) => m.isGift), ...items.filter((m) => !m.isGift)];
  const head = sorted.slice(0, VISIBLE);
  const rest = sorted.slice(VISIBLE);
  return (
    <div className={styles.root}>
      {items.length === 0 ? (
        <p className={`box ${styles.none}`}>메뉴를 준비 중입니다. 네이버 플레이스에서 확인해 주세요.</p>
      ) : (
        <>
          <ul className={styles.list}>{head.map((m) => <Row key={m.id} m={m} />)}</ul>
          {rest.length > 0 && (
            <details className={styles.more}>
              <summary className={`btn btn-soft btn-block ${styles.moreBtn}`}>메뉴 {rest.length}개 더 보기</summary>
              <ul className={styles.list}>{rest.map((m) => <Row key={m.id} m={m} />)}</ul>
            </details>
          )}
        </>
      )}
      {menuUrl && <Button href={menuUrl} variant="ghost" srSuffix={` — ${store.shortName}`}>네이버에서 전체 메뉴 보기</Button>}
      <p className="small faint">※ 사진은 연출된 이미지로 실제와 다를 수 있습니다. 가격은 매장 사정에 따라 바뀔 수 있습니다.</p>
    </div>
  );
}
