import type { Store } from "@/lib/stores";
import { STORE_COPY, kstNow, openStatus, parseHours } from "./StoreHelpers";
import styles from "./StoreHero.module.css";

/** 이름, 한 줄, 평점·대표 술, 그리고 영업·주소·전화 표. */
export function StoreHero({ store }: { store: Store }) {
  const st = openStatus(store);
  const r = store.naverRating;
  const { dow } = kstNow();
  const otherDays = parseHours(store)
    .filter((l) => !l.dayset.has(dow))
    .map((l) => `${l.days} ${l.openText}~${l.closeText}`);
  const today = st.today === "휴무" ? "오늘 휴무" : `오늘 ${st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "")}`;
  const state = st.open ? "영업 중" : st.today === "휴무" ? "" : /오픈 예정/.test(st.text) ? "준비 중" : "영업 종료";
  const sub = [st.lastOrder ? `주문 마감 ${st.lastOrder}` : null, ...otherDays].filter(Boolean).join(" · ");

  return (
    <header className={styles.hero}>
      <h1 className="h1">{store.shortName}</h1>
      <p className={styles.line}>{STORE_COPY[store.id].headline}</p>
      <p className={`cap ${styles.meta}`}>
        {r && <span className="num">★ {r.score.toFixed(2)} ({r.count.toLocaleString("ko-KR")})</span>}
        <span className={styles.drink}><span className="dot" aria-hidden="true" />{store.drink}</span>
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
    </header>
  );
}
