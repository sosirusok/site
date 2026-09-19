import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { placeLinks } from "@/lib/naver";
import type { Store } from "@/lib/stores";
import { kstNow, nowText, openStatus, parseHours } from "./StoreHelpers";
import { STORE_FAN } from "./storePhotos";
import styles from "./StoreHero.module.css";

/**
 * 매장 첫 화면 — 대표 안주 사진(16:10, 화면 폭 가득) → 흰 바탕에 배지(차수·술·영업 상태), 상호(h1), 한 줄 소개, 별점·리뷰 수,
 * 오늘 영업시간(다른 요일은 작게)·주소, [전화하기][길찾기]. 예약하기는 아래 고정 바에.
 */
export function StoreHero({ store }: { store: Store }) {
  const st = openStatus(store);
  const r = store.naverRating;
  const { dow } = kstNow();
  const photo = STORE_FAN[store.id][0]!;
  const alt = store.images.find((im) => im.src === photo.src)?.alt ?? photo.cap;
  const otherDays = parseHours(store)
    .filter((l) => !l.dayset.has(dow))
    .map((l) => `${l.days} ${l.openText}~${l.closeText}`);
  const today = st.today === "휴무" ? "오늘 휴무" : `오늘 ${st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "")}`;
  const state = st.today === "휴무" ? "휴무" : nowText(st);
  const links = placeLinks(store);

  return (
    <header className={styles.hero}>
      <div className={styles.shotWrap}>
        <Image src={photo.src} alt={alt} fill priority sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: photo.pos }} className={styles.shot} />
      </div>
      <div className={styles.body}>
        <div className={styles.badges}>
          <span className="badge badge-store">{store.course.n}차</span>
          <span className="badge">{store.drink}</span>
          <span className={`badge ${st.open ? "dot-on" : "dot-off"}`}>{state}</span>
        </div>
        <h1 className={`h1 ${styles.name}`}>{store.name}</h1>
        <p className="lead">{store.headline}</p>
        {r && <p className={`small ${styles.rating}`}><span className={styles.star} aria-hidden="true">★</span> <b className="num">{r.score.toFixed(2)}</b> <span className="muted num">네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개</span></p>}
        <dl className={`kv ${styles.kv}`}>
          <dt>영업시간</dt>
          <dd className="num">{today}{st.lastOrder && <span className="muted"> · 주문 마감 {st.lastOrder}</span>}{otherDays.length > 0 && <span className={`small muted ${styles.other}`}>{otherDays.join(" · ")}</span>}</dd>
          <dt>주소</dt>
          <dd>{store.address}</dd>
        </dl>
        <div className="btn-row">
          {links && <Button href={links.booking} variant="naver" srSuffix={` — ${store.shortName}`}>네이버 예약하기</Button>}
          {links && <Button href={links.home} variant="outline" srSuffix={` — ${store.shortName}`}>네이버 플레이스</Button>}
        </div>
      </div>
    </header>
  );
}
