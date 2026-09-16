import Link from "next/link";
import { distanceM, walkMinutes } from "@/lib/geo";
import { nextStore, type Store } from "@/lib/stores";
import { HandArrow } from "./HandArrow";
import { Piece, plateOf } from "./Poster";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 1분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

/**
 * 다음 집 — 손글씨 화살표 메모와 다음 가게의 포스터 간판 조각(작게). 3차 뒤에는 처음(1차)으로 돌아간다.
 * 간판을 누르면 그 가게 화면. 초록 버튼은 이 화면 아래 고정된 예약하기 하나뿐이라 여기엔 두지 않는다.
 */
export function NextStop({ store }: { store: Store }) {
  const next = nextStore(store.id);
  if (next.id === store.id) return null;
  const last = store.course.n === 3;
  return (
    <section className={styles.sec} data-store={next.id} aria-labelledby="next-title">
      <h2 id="next-title" className="sr-only">{last ? "처음부터 다시" : "다음 집"}</h2>
      <p className={`hand hand-w ${styles.note}`}>
        <HandArrow className={styles.arrow} />
        <span>{last ? `한 바퀴 돌았으면 처음부터! 걸어서 ${walkMin(store, next)}분 → 1차 ${next.shortName}` : `걸어서 ${walkMin(store, next)}분 → 다음은 ${next.course.n}차 ${next.shortName}`}</span>
      </p>
      <Link href={`/stores/${next.id}`} className={`tape-tr ${styles.plateLink}`} aria-label={`${next.course.n}차 ${next.shortName} 가게 보기`}>
        <Piece name={plateOf(next.id)} rotate={2.5} sizes="240px" className={styles.plate} />
      </Link>
    </section>
  );
}
