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
 * 다음 집 — 크림색 메모 한 장에 빨간 손글씨 "여기서 걸어서 N분 → 다음은 2차 조선칼국수",
 * 메모 모서리에 다음 가게의 포스터 간판 조각이 테이프로 작게 붙어 있다(누르면 그 가게 화면).
 * 홈에서는 블록 사이에(next 를 넘김), 가게 화면에서는 맨 아래에(3차 뒤에는 처음 1차로).
 */
export function NextStop({ store, next: nextProp, className = "", rotate = -1.5 }: { store: Store; next?: Store; className?: string; rotate?: number }) {
  const next = nextProp ?? nextStore(store.id);
  if (next.id === store.id) return null;
  const loop = next.course.n <= store.course.n;
  const min = walkMin(store, next);
  const line = loop ? `한 바퀴 돌았으면 처음부터! 여기서 걸어서 ${min}분 → 다시 ${next.course.n}차 ${next.shortName}` : `여기서 걸어서 ${min}분 → 다음은 ${next.course.n}차 ${next.shortName}`;
  return (
    <section className={`${styles.sec} ${className}`} data-store={next.id} aria-label={loop ? "처음부터 다시" : "다음 집"}>
      <div className={`paper ${styles.note}`} style={{ "--r": `${rotate}deg` } as CSSProperties}>
        <p className={`hand hand-r ${styles.text}`}>{line}</p>
        <Link href={`/stores/${next.id}`} className={`tape ${styles.plateLink}`} aria-label={`${next.course.n}차 ${next.shortName} 가게 보기`}>
          <Piece name={plateOf(next.id)} rotate={5} sizes="130px" className={styles.plate} />
        </Link>
      </div>
    </section>
  );
}
