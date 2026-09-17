import Link from "next/link";
import type { CSSProperties } from "react";
import { distanceM, walkMinutes } from "@/lib/geo";
import { nextStore, type Store } from "@/lib/stores";
import { KitPiece } from "./Kit";
import { Piece, plateOf } from "./Poster";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 1분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

const NBSP = " ";

/**
 * 다음 매장 — 크림 종이 한 줄: 다음 매장의 키트 간판(작게 84px) + 두 줄 글자("다음 매장" 13px / "3차 와르르맨숀 · 도보 1분" 15px 굵게) + 키트 화살표(44x22, 없으면 꺾쇠).
 * 한 줄(≈230px)은 간판 84 + 화살표 44 를 빼면 358 단에 들어가지 않아 아무 데서나 꺾이던 것을 두 줄로 정했다. 줄 전체가 그 매장 화면으로 가는 링크.
 * 홈에서는 블록 사이에(next 를 넘김), 매장 화면에서는 맨 아래에(3차 뒤에는 처음 1차로, 같은 형식).
 */
export function NextStop({ store, next: nextProp, className = "", rotate = -1 }: { store: Store; next?: Store; className?: string; rotate?: number }) {
  const next = nextProp ?? nextStore(store.id);
  if (next.id === store.id) return null;
  const min = walkMin(store, next);
  // "도보 / 2분"처럼 끊기지 않도록 덩어리 안은 NBSP — 줄바꿈은 " · " 뒤에서만
  const line = `${next.course.n}차${NBSP}${next.shortName}${NBSP}· 도보${NBSP}${min}분`;
  return (
    <section className={`${styles.sec} ${className}`} data-store={next.id} aria-label="다음 매장">
      <Link href={`/stores/${next.id}`} className={`paper ${styles.row}`} style={{ "--r": `${rotate}deg` } as CSSProperties}>
        <Piece name={plateOf(next.id)} decorative rotate={0} sizes="90px" className={styles.plate} />
        <span className={styles.text}><span className={styles.lead}>다음 매장</span><span className="sr-only"> · </span><span className={styles.main}>{line}</span></span>
        <KitPiece name="arrow" decorative bare className={styles.arrow} sizes="44px" fallback={<span className={styles.chevron} aria-hidden="true">›</span>} />
      </Link>
    </section>
  );
}
