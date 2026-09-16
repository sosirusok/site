import type { CSSProperties } from "react";
import type { Store } from "@/lib/stores";
import styles from "./StoreReviews.module.css";

/** 리뷰 — 어두운 띠에 별점 한 줄, 방문자 인용은 찢은 종이 조각 위에, 리뷰 이벤트(관리자 문구)는 어두운 띠, 링크 둘. 값은 stores.ts 의 실제 리뷰. */
export function StoreReviews({ store, limit = 2, reviewUrl, benefit = null }: { store: Store; limit?: number; reviewUrl: string | null; benefit?: string | null }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <div className={styles.root}>
      {r && (
        <p className={`info num ${styles.rating}`}>
          <span className="star">★ {r.score.toFixed(2)}</span> · 네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개
        </p>
      )}
      {quotes.length > 0 && (
        <ul className={styles.list}>
          {quotes.map((q, i) => (
            <li key={q.date + q.text.slice(0, 8)} className={`scrap ${styles.quote} ${i % 2 ? styles.quoteR : styles.quoteL}`} style={{ "--r": `${i % 2 ? 1.5 : -1.5}deg` } as CSSProperties}>
              <div className="scrap-in">
                <p className={styles.text}>“{q.text}”</p>
                <p className={styles.meta}>네이버 방문자 리뷰 · {q.date}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {benefit && <p className={`info ${styles.benefit}`}><b>리뷰 이벤트</b> · {benefit}</p>}
      {reviewUrl && (
        <div className={styles.links}>
          <a className="link-d" href={reviewUrl} target="_blank" rel="noreferrer">리뷰 작성</a>
          <a className="link-d" href={reviewUrl} target="_blank" rel="noreferrer">리뷰 더보기</a>
        </div>
      )}
    </div>
  );
}
