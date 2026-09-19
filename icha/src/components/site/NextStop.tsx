import Link from "next/link";
import { distanceM, walkMinutes } from "@/lib/geo";
import { nextStore, type Store } from "@/lib/stores";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 1분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

/** 다음 매장 — 카드 한 줄(차수 배지 · 상호 · 도보 N분 · 화살표). 매장 화면 맨 아래(3차 뒤에는 처음 1차로). */
export function NextStop({ store, next: nextProp, className = "" }: { store: Store; next?: Store; className?: string }) {
  const next = nextProp ?? nextStore(store.id);
  if (next.id === store.id) return null;
  const min = walkMin(store, next);
  return (
    <Link href={`/stores/${next.id}`} className={`card ${styles.row} ${className}`} data-store={next.id} aria-label={`다음 매장 ${next.course.n}차 ${next.shortName}, 도보 ${min}분`}>
      <span className={styles.lead}>다음 매장</span>
      <span className={`badge badge-store ${styles.no}`}>{next.course.n}차</span>
      <span className={styles.name}>{next.shortName}</span>
      <span className={`small muted num ${styles.walk}`}>도보 {min}분</span>
      <svg className={styles.chev} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 5l5 5-5 5" /></svg>
    </Link>
  );
}
