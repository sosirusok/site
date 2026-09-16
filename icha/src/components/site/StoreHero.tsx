import { placeLinks } from "@/lib/naver";
import type { Store } from "@/lib/stores";
import { kstNow, openStatus, parseHours } from "./StoreHelpers";
import styles from "./StoreHero.module.css";

/** 이름(노랑 붓글씨) + N차 칩 + 코스 한 마디 + 평점, 영업·주소·전화 표, 큰 플레이스 버튼과 작은 버튼 줄(리뷰·사진·길찾기) */
export function StoreHero({ store }: { store: Store }) {
  const st = openStatus(store);
  const r = store.naverRating;
  const links = placeLinks(store);
  const { dow } = kstNow();
  const otherDays = parseHours(store)
    .filter((l) => !l.dayset.has(dow))
    .map((l) => `${l.days} ${l.openText}~${l.closeText}`);
  const today = st.today === "휴무" ? "오늘 쉬어요" : `오늘 ${st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "")}`;
  const state = st.open ? "영업 중" : st.today === "휴무" ? "" : /오픈 예정/.test(st.text) ? "준비 중" : "영업 끝";
  const sub = [st.lastOrder ? `주문 마감 ${st.lastOrder}` : null, ...otherDays].filter(Boolean).join(" · ");

  return (
    <header className={styles.hero}>
      <h1 className="h1-event">{store.shortName}</h1>
      <p className={styles.course}>
        <span className="tag tag-neon">{store.course.n}차</span>
        <span className={styles.courseLine}>{store.course.line}</span>
        {r && <span className={`num ${styles.rating}`}>★ {r.score.toFixed(2)} ({r.count.toLocaleString("ko-KR")})</span>}
      </p>
      <dl className={`kv ${styles.kv}`}>
        <dt>영업</dt>
        <dd>
          <span className="num">{today}</span>
          {state && <> · <b className={st.open ? styles.open : styles.closed}>{state}</b></>}
          {sub && <span className={`cap num ${styles.sub}`}>{sub}</span>}
        </dd>
        <dt>주소</dt>
        <dd>{store.address}</dd>
        {store.phone && (
          <>
            <dt>전화</dt>
            <dd><a href={`tel:${store.phone.replace(/-/g, "")}`} className={`num ${styles.tel}`}>{store.phone}</a></dd>
          </>
        )}
      </dl>
      {links && (
        <div className={styles.naver}>
          <a className="btn btn-naver btn-block" href={links.home} target="_blank" rel="noreferrer">네이버 플레이스에서 보기</a>
          <div className={styles.small}>
            <a className="btn btn-secondary btn-sm" href={links.review} target="_blank" rel="noreferrer">리뷰</a>
            <a className="btn btn-secondary btn-sm" href={links.photo} target="_blank" rel="noreferrer">사진</a>
            <a className="btn btn-secondary btn-sm" href={links.directions} target="_blank" rel="noreferrer">길찾기</a>
          </div>
        </div>
      )}
    </header>
  );
}
