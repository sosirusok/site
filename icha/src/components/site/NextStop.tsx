import Link from "next/link";
import type { CSSProperties } from "react";
import { distanceM, walkMinutes } from "@/lib/geo";
import { nextStore, type Store } from "@/lib/stores";
import { Piece, plateOf } from "./Poster";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 1분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

/**
 * 다음 매장 — 크림 종이 한 줄: 다음 매장의 포스터 간판 조각(작게) + "다음 매장 · 3차 와르르맨숀 · 도보 1분". 줄 전체가 그 매장 화면으로 가는 링크.
 * 홈에서는 블록 사이에(next 를 넘김), 매장 화면에서는 맨 아래에(3차 뒤에는 처음 1차로, 같은 형식).
 */
export function NextStop({ store, next: nextProp, className = "", rotate = -1 }: { store: Store; next?: Store; className?: string; rotate?: number }) {
  const next = nextProp ?? nextStore(store.id);
  if (next.id === store.id) return null;
  const min = walkMin(store, next);
  // 줄이 넘칠 때 "도보 / 2분"처럼 끊기지 않도록 덩어리 안은 NBSP(\u00A0) — 줄바꿈은 " · " 뒤에서만
  const line = `다음\u00A0매장\u00A0· ${next.course.n}차\u00A0${next.shortName}\u00A0· 도보\u00A0${min}분`;
  return (
    <section className={`${styles.sec} ${className}`} data-store={next.id} aria-label="다음 매장">
      <Link href={`/stores/${next.id}`} className={`paper ${styles.row}`} style={{ "--r": `${rotate}deg` } as CSSProperties}>
        <Piece name={plateOf(next.id)} decorative rotate={0} sizes="80px" className={styles.plate} />
        <span className={styles.text}>{line}</span>
        <span className={styles.arrow} aria-hidden="true">›</span>
      </Link>
    </section>
  );
}
