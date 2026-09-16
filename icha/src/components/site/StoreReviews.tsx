import type { Store } from "@/lib/stores";
import styles from "./StoreReviews.module.css";

function asOfText(asOf: string): string {
  const m = asOf.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}.${m[2]} 기준` : asOf;
}

/** 고객 리뷰 — 네이버 방문자 평점(실제 값)과 인용 몇 개를 선과 글자로만. */
export function StoreReviews({ store, limit = 2, index }: { store: Store; limit?: number; index?: number }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <section className={styles.block} aria-label={`${store.shortName} 리뷰`}>
      <div className={styles.head}>
        <h3 className={styles.name}>{index != null ? `${index}. ` : ""}{store.shortName}</h3>
        {r && (
          <p className={styles.rating}>
            네이버 방문자 평점 <b className="num">{r.score.toFixed(2)}</b> · 리뷰 {r.count.toLocaleString("ko-KR")}건 <span className={styles.asOf}>({asOfText(r.asOf)})</span>
          </p>
        )}
      </div>
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
    </section>
  );
}
