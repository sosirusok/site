import Link from "next/link";
import { Chevron } from "@/components/ui/Chevron";
import { distanceM, walkMinutes } from "@/lib/geo";
import { placeLinks } from "@/lib/naver";
import { nextStore, type Store } from "@/lib/stores";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 "50m 안" */
function walkText(a: Store, b: Store): string {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return "50m 안";
  return `걸어서 ${walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }))}분`;
}

/**
 * 다음 집 — 코스의 다음 매장(1차→2차→3차)을 그 매장색 네온 카드로. 3차 뒤에는 처음(1차)으로 돌아간다.
 * 버튼은 초록 예약하기(네이버 예약)와 길찾기.
 */
export function NextStop({ store }: { store: Store }) {
  const next = nextStore(store.id);
  if (next.id === store.id) return null;
  const last = store.course.n === 3;
  const links = placeLinks(next);
  return (
    <div className={`card-neon ${styles.card}`} data-store={next.id}>
      <Link href={`/stores/${next.id}`} className={styles.head}>
        <span className={styles.text}>
          <span className={`h2-event neon ${styles.title}`}>{last ? "오늘 코스 끝 · 처음부터 다시" : `다음은 ${next.course.n}차 ${next.shortName}`}</span>
          <span className={`cap ${styles.sub}`}>{last ? `1차 ${next.shortName} · ` : ""}{next.drink} · {walkText(store, next)}</span>
        </span>
        <Chevron />
      </Link>
      {links && (
        <div className={styles.btns}>
          <a className="btn btn-naver btn-sm" href={links.booking} target="_blank" rel="noreferrer">예약하기</a>
          <a className="btn btn-secondary btn-sm" href={links.directions} target="_blank" rel="noreferrer">길찾기</a>
        </div>
      )}
    </div>
  );
}
