import Link from "next/link";
import { distanceM, walkMinutes } from "@/lib/geo";
import { nextStore, type Store } from "@/lib/stores";
import { KitPiece } from "./Kit";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 1분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

const NBSP = " ";

/**
 * 다음 매장 — 포스터의 검은 띠(화면 폭 가득 390x44): 키트 화살표(44px, 90° 아래로) + 노란 Do Hyeon 16px "다음 매장 · 2차 조선칼국수 · 도보 2분".
 * 띠 전체가 그 매장 화면으로 가는 링크. 홈에서는 장면 사이(next 를 넘김), 매장 화면에서는 맨 아래(3차 뒤에는 처음 1차로).
 */
export function NextStop({ store, next: nextProp, className = "" }: { store: Store; next?: Store; className?: string }) {
  const next = nextProp ?? nextStore(store.id);
  if (next.id === store.id) return null;
  const min = walkMin(store, next);
  // "도보 / 2분"처럼 끊기지 않도록 덩어리 안은 NBSP
  const line = `${next.course.n}차${NBSP}${next.shortName}${NBSP}· 도보${NBSP}${min}분`;
  return (
    <section className={`${styles.sec} ${className}`} data-store={next.id} aria-label="다음 매장">
      <Link href={`/stores/${next.id}`} className={`band hz-b ${styles.row}`}>
        <KitPiece name="arrow" decorative bare className={styles.arrow} sizes="44px" fallback={<span className={styles.chevron} aria-hidden="true">↓</span>} />
        <span className={styles.text}><span className={styles.lead}>다음 매장</span> · {line}</span>
      </Link>
    </section>
  );
}
