import type { Store } from "@/lib/stores";
import styles from "./StoreReviews.module.css";

/** 리뷰 — 평점 한 줄, 방문자 인용 두 개(그 집 색 세로선), 작은 글자 링크 둘. 값은 stores.ts 의 실제 리뷰. */
export function StoreReviews({ store, limit = 2, reviewUrl, benefit = null }: { store: Store; limit?: number; reviewUrl: string | null; benefit?: string | null }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <div className={styles.root}>
      {r && (
        <p className={`num ${styles.rating}`}>
          <b className={styles.score}>★ {r.score.toFixed(2)}</b>
          <span>네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개</span>
        </p>
      )}
      {quotes.length > 0 && (
        <ul className={styles.list}>
          {quotes.map((q) => (
            <li key={q.date + q.text.slice(0, 8)} className={styles.quote}>
              <p className={styles.text}>{q.text}</p>
              <p className={styles.meta}>네이버 방문자 · {q.date}</p>
            </li>
          ))}
        </ul>
      )}
      {benefit && <p className={styles.benefit}>{benefit}</p>}
      {reviewUrl && (
        <div className={styles.btns}>
          <a className={styles.link} href={reviewUrl} target="_blank" rel="noreferrer">리뷰 쓰기</a>
          <a className={styles.link} href={reviewUrl} target="_blank" rel="noreferrer">리뷰 더 보기</a>
        </div>
      )}
    </div>
  );
}
