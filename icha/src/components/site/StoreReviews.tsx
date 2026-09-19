import { Button } from "@/components/ui/Button";
import type { Store } from "@/lib/stores";
import styles from "./StoreReviews.module.css";

/** 리뷰 — 별점 한 줄(★ 4.52 · 네이버 방문자 리뷰 729개), 방문자 인용 카드 둘, 리뷰 이벤트(관리자 문구), [네이버 리뷰 남기기]. 값은 stores.ts 의 실제 리뷰. */
export function StoreReviews({ store, limit = 2, reviewUrl, benefit = null }: { store: Store; limit?: number; reviewUrl: string | null; benefit?: string | null }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <div className={styles.root}>
      {r && (
        <p className={styles.rating}>
          <span className={styles.star} aria-hidden="true">★</span>
          <b className={`num ${styles.score}`}>{r.score.toFixed(2)}</b>
          <span className="small muted num">네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개 · {r.asOf.slice(0, 7).replace("-", ".")} 기준</span>
        </p>
      )}
      {quotes.length > 0 && (
        <ul className={styles.list}>
          {quotes.map((q) => (
            <li key={q.date + q.text.slice(0, 8)} className={`box ${styles.quote}`}>
              <p className={styles.text}>{q.text}</p>
              <p className={`small faint ${styles.meta}`}>네이버 방문자 리뷰 · {q.date}</p>
            </li>
          ))}
        </ul>
      )}
      {benefit && <p className={`box-brand ${styles.benefit}`}><b>리뷰 이벤트</b> {benefit}</p>}
      {reviewUrl && <Button href={reviewUrl} variant="outline" block srSuffix={` — ${store.shortName}`}>네이버 리뷰 남기기</Button>}
    </div>
  );
}
