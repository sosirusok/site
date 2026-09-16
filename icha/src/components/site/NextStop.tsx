import Image from "next/image";
import Link from "next/link";
import { distanceM, walkMinutes } from "@/lib/geo";
import { placeLinks } from "@/lib/naver";
import { nextStore, type Store } from "@/lib/stores";
import { StoreSign } from "./StoreSign";
import { NIGHT_PHOTO } from "./storePhotos";
import styles from "./NextStop.module.css";

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 "50m 안" */
function walkText(a: Store, b: Store): string {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return "50m 안";
  return `걸어서 ${walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }))}분`;
}

/**
 * 다음 집 — 코스의 다음 매장(1차→2차→3차)을 사진 한 장으로. 3차 뒤에는 처음(1차)으로 돌아간다.
 * 사진을 누르면 그 가게 화면, 초록 버튼은 예약하기 하나뿐이고 길찾기는 작은 글자다.
 */
export function NextStop({ store }: { store: Store }) {
  const next = nextStore(store.id);
  if (next.id === store.id) return null;
  const last = store.course.n === 3;
  const links = placeLinks(next);
  const photo = NIGHT_PHOTO[next.id];
  const alt = next.images.find((im) => im.src === photo.src)?.alt ?? `${next.shortName} 밤 외관`;
  return (
    <section className={styles.sec} data-store={next.id} aria-labelledby="next-title">
      <div className={`wrap ${styles.head}`}>
        <p className={`kicker ${styles.kick}`}>{last ? "코스 한 바퀴" : `${next.course.n}차로 이어서`}</p>
        <h2 id="next-title" className={`tube ${styles.title}`}>{last ? "처음부터 다시" : "다음 집"}</h2>
      </div>
      <Link href={`/stores/${next.id}`} className={`frame ${styles.shot}`}>
        <Image src={photo.src} alt={alt} fill sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: photo.pos }} className={styles.img} />
        <span className={`vignette ${styles.layer}`} aria-hidden="true" />
        <span className={`scrim ${styles.layer}`} aria-hidden="true" />
        <span className={`grain ${styles.layer}`} aria-hidden="true" />
        <span className={styles.signWrap}>
          <StoreSign id={next.id} className={styles.sign} sizes="(min-width: 480px) 320px, 72vw" />
        </span>
        <span className="sr-only">{next.course.n}차 {next.name} — 가게 보기</span>
      </Link>
      <div className={styles.under}>
        <p className={styles.line}>
          <b className={styles.lineB}>{next.course.n}차 {next.shortName}</b>
          {next.drink} · {walkText(store, next)}
        </p>
      </div>
      {links && (
        <div className={styles.cta}>
          <a className="btn btn-naver" href={links.booking} target="_blank" rel="noreferrer">예약하기<span className="sr-only"> — {next.shortName}</span></a>
          <a className={styles.way} href={links.directions} target="_blank" rel="noreferrer">길찾기</a>
        </div>
      )}
    </section>
  );
}
