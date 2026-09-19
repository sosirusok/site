import { Button } from "@/components/ui/Button";
import type { Store } from "@/lib/stores";
import styles from "./StoreReviews.module.css";

/**
 * 가 본 사람들 — 실제로 남은 네이버 후기를 그대로 흘린다.
 * 별 다섯 개를 채워 놓는 짓은 하지 않는다(4.82 에 별 다섯 개는 값과 무관한 장식이다).
 * 점수는 매장 첫 화면에 이미 크게 있으므로 여기서는 개수와 기준일만. 인용은 따옴표 글리프도 색 기둥도 없이 글자만.
 */
export function StoreReviews({ store, limit = 2, reviewUrl, benefit = null }: { store: Store; limit?: number; reviewUrl: string | null; benefit?: string | null }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <div className={styles.root}>
      {r && <p className={`num ${styles.count}`}>네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개 · {r.asOf.slice(0, 7).replace("-", ".")} 기준</p>}
      {quotes.length > 0 && (
        <ul className={styles.list}>
          {quotes.map((q) => (
            <li key={q.date + q.text.slice(0, 8)} className={styles.quote}>
              <p className={styles.text}>{q.text}</p>
              <p className={`num ${styles.meta}`}>{q.date}</p>
            </li>
          ))}
        </ul>
      )}
      {benefit && <p className={`box-brand ${styles.benefit}`}><b>리뷰 이벤트</b> {benefit}</p>}
      {reviewUrl && <Button href={reviewUrl} variant="outline" block srSuffix={` — ${store.shortName}`}>네이버 리뷰 남기기</Button>}
    </div>
  );
}
