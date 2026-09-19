import Link from "next/link";
import { distanceM, walkMinutes } from "@/lib/geo";
import { nextStore, type Store } from "@/lib/stores";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 1분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

/** 다음 매장 — 카드가 아니라 화면 폭을 채우는 형광 바. 속 빈 차수 숫자 + 간판 상호 + 도보 N분 + 큰 화살표. */
export function NextStop({ store, next: nextProp, className = "" }: { store: Store; next?: Store; className?: string }) {
  const next = nextProp ?? nextStore(store.id);
  if (next.id === store.id) return null;
  const min = walkMin(store, next);
  return (
    <Link href={`/stores/${next.id}`} className={`${styles.bar} ${className}`} data-store={next.id} aria-label={`다음 매장 ${next.course.n}차 ${next.shortName}, 도보 ${min}분`}>
      <span className={styles.no} aria-hidden="true">{String(next.course.n).padStart(2, "0")}</span>
      <span className={styles.body}>
        <span className={styles.lead} aria-hidden="true">NEXT STOP · 도보 {min}분</span>
        <span className={styles.name}>{next.shortName}</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </Link>
  );
}
