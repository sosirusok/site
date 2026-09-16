import type { Store } from "@/lib/stores";
import styles from "./StoreReviews.module.css";

/** 리뷰 — 평점 한 줄과 방문자 인용 두 개(각 2줄까지). 값은 stores.ts 의 실제 리뷰. */
export function StoreReviews({ store, limit = 2 }: { store: Store; limit?: number }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <div className={styles.root}>
      {r && (
        <p className={`num ${styles.rating}`}>
          <b className={styles.score}>★ {r.score.toFixed(2)}</b>
          <span className="cap">네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개</span>
        </p>
      )}
      {quotes.length > 0 && (
        <ul className={styles.list}>
          {quotes.map((q) => (
            <li key={q.date + q.text.slice(0, 8)} className="card-soft">
              <p className={styles.text}>{q.text}</p>
              <p className={`cap ${styles.meta}`}>네이버 방문자 · {q.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
