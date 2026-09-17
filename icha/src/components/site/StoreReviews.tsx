import type { CSSProperties } from "react";
import type { Store } from "@/lib/stores";
import { StickerButton } from "./Kit";
import styles from "./StoreReviews.module.css";

/**
 * 리뷰 — 노란 콜아웃 한 줄(★ 4.52 · 네이버 방문자 리뷰 729개), 방문자 인용은 찢은 종이 조각이 서로 18px 씩 겹쳐 붙고(왼쪽·오른쪽 번갈아, ±1.5°),
 * 리뷰 이벤트(관리자 문구)는 검은 띠, 키트 [네이버 리뷰 남기기](44px) + 더보기 글자 링크. 값은 stores.ts 의 실제 리뷰.
 */
export function StoreReviews({ store, limit = 2, reviewUrl, benefit = null }: { store: Store; limit?: number; reviewUrl: string | null; benefit?: string | null }) {
  const quotes = store.quotes.slice(0, limit);
  const r = store.naverRating;
  if (!quotes.length && !r) return null;
  return (
    <div className={styles.root}>
      {r && (
        <p className={`callout ${styles.rating}`}>
          ★ {r.score.toFixed(2)} · 네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개
        </p>
      )}
      {quotes.length > 0 && (
        <ul className={styles.list}>
          {quotes.map((q, i) => (
            <li key={q.date + q.text.slice(0, 8)} className={`scrap ${styles.quote} ${i % 2 ? styles.quoteR : styles.quoteL}`} style={{ "--r": `${i % 2 ? 1.5 : -1.5}deg`, zIndex: i + 1 } as CSSProperties}>
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
          <StickerButton kind="review" size="sm" tilt={0} href={reviewUrl} style={{ "--r": "-2deg" } as CSSProperties}>네이버 리뷰 남기기</StickerButton>
          <a className="link-d" href={reviewUrl} target="_blank" rel="noreferrer">리뷰 더보기</a>
        </div>
      )}
    </div>
  );
}
