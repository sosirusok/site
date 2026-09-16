import type { Store } from "@/lib/stores";
import { asOfText } from "./StoreHelpers";
import styles from "./StoreReviews.module.css";

/** 손님들이 남긴 말 — 네이버 방문자 평점(실제 값)과 인용 몇 개를 선으로만 나눠서. */
export function StoreReviews({ store, limit = 3 }: { store: Store; limit?: number }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <div className={styles.root}>
      {r && (
        <p className={styles.rating}>
          네이버 방문자 평점 <b className={styles.score}>{r.score.toFixed(2)}</b>
          <span className={styles.count}>리뷰 {r.count.toLocaleString("ko-KR")}건 · {asOfText(r.asOf)} 기준</span>
        </p>
      )}
      {quotes.length > 0 && (
        <ul className={styles.list}>
          {quotes.map((q, i) => (
            <li key={i} className={styles.item}>
              <p className={styles.text}>{q.text}</p>
              <p className={styles.meta}>네이버 방문자 리뷰 · {q.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
