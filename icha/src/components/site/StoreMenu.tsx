import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

/** 처음에 보이는 줄 수. 나머지는 '메뉴 더보기' 안에. */
const VISIBLE = 8;

/**
 * 메뉴 사진 — 실제로 찍은 사진만 쓴다.
 * /menu/*.png 는 배경을 뺀 생성 일러스트다. 실제 장사하는 가게 메뉴판에 그런 그림은 없고,
 * 스물세 줄이 같은 화풍으로 내려가면 그게 만들어 붙인 티다. 사진이 없으면 사진 칸 자체를 비운다.
 */
export function hasRealPhoto(m: MenuItem): boolean {
  if (m.hasImageData) return true;
  return Boolean(m.imagePath) && !/\.png$/i.test(m.imagePath ?? "");
}

export function MenuThumb({ m, size = 64 }: { m: MenuItem; size?: number }) {
  const box = { width: size, height: size };
  if (!hasRealPhoto(m)) return null;
  if (m.hasImageData) return <Image src={menuImageUrl(m)} alt="" width={size} height={size} sizes={`${size}px`} unoptimized className={styles.photo} style={box} />;
  return <Image src={m.imagePath!} alt="" width={size} height={size} sizes={`${size}px`} className={styles.photo} style={box} />;
}

function Row({ m, noThumb = false }: { m: MenuItem; noThumb?: boolean }) {
  return (
    <li className={styles.item} data-nothumb={noThumb || undefined}>
      {!noThumb && <MenuThumb m={m} />}
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
  // 같은 사진이 여러 줄에 붙어 있으면(생맥주 4종이 같은 잔 한 장) "데이터가 없어 하나로 때웠다"가 그대로 보인다.
  // 처음 나온 줄에만 남기고 나머지는 사진 칸 자체를 없앤다 — 빈 회색 네모를 두면 그게 더 눈에 띈다.
  const used = new Set<string>();
  const dup = new Set<number>();
  for (const m of sorted) {
    if (!hasRealPhoto(m)) { dup.add(m.id); continue; }
    const key = m.imagePath ?? "";
    if (!key) continue;
    if (used.has(key)) dup.add(m.id);
    else used.add(key);
  }
  const head = sorted.slice(0, VISIBLE);
  const rest = sorted.slice(VISIBLE);
  return (
    <div className={styles.root}>
      {items.length === 0 ? (
        <p className={`box ${styles.none}`}>메뉴를 준비 중입니다. 네이버 플레이스에서 확인해 주세요.</p>
      ) : (
        <>
          <ul className={styles.list}>{head.map((m) => <Row key={m.id} m={m} noThumb={dup.has(m.id)} />)}</ul>
          {rest.length > 0 && (
            <details className={styles.more}>
              <summary className={`btn btn-outline btn-block ${styles.moreBtn}`}>메뉴 {rest.length}개 더 보기</summary>
              <ul className={styles.list}>{rest.map((m) => <Row key={m.id} m={m} noThumb={dup.has(m.id)} />)}</ul>
            </details>
          )}
        </>
      )}
      {menuUrl && <Button href={menuUrl} variant="ghost" srSuffix={` — ${store.shortName}`}>네이버에서 전체 메뉴 보기</Button>}
      <p className="fineprint">가격은 2026년 9월 매장 메뉴판 기준입니다.</p>
    </div>
  );
}
