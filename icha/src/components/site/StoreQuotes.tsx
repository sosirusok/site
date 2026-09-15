import type { Store } from "@/lib/stores";
import styles from "./StoreQuotes.module.css";

export type QuoteCard = { text: string; date: string; store?: string; num?: string };

/** 다녀간 분들 — 실제 방문자 리뷰 인용. 홈(매장명 포함)과 매장 상세(매장명 없음) 공용. */
export function StoreQuotes({ quotes, columns = 3, limitMobile }: { quotes: QuoteCard[]; columns?: 2 | 3; limitMobile?: number }) {
  if (!quotes.length) return null;
  return (
    <ul className={`${styles.list} ${columns === 2 ? styles.two : ""}`}>
      {quotes.map((q, i) => (
        <li key={i} className={`${styles.item} rise rise-d${(i % 3) + 1} ${limitMobile != null && i >= limitMobile ? styles.deskOnly : ""}`}>
          <blockquote className={styles.quote}>
            <span className={styles.mark} aria-hidden="true">“</span>
            <p className={styles.text}>{q.text}</p>
            <footer className={styles.foot}>
              {q.store && <b>{q.num ? <span className={styles.num}>{q.num}</span> : null}{q.store}</b>}
              <span>네이버 방문자 리뷰 · {q.date}</span>
            </footer>
          </blockquote>
        </li>
      ))}
    </ul>
  );
}

export function quotesOf(stores: Store[], perStore = 3): QuoteCard[] {
  const out: QuoteCard[] = [];
  const max = Math.max(...stores.map((s) => s.quotes.length));
  // 매장별로 번갈아 가며 섞는다 (한 매장 것만 앞에 몰리지 않게)
  for (let i = 0; i < Math.min(max, perStore); i++) {
    stores.forEach((s, si) => {
      const q = s.quotes[i];
      if (q) out.push({ ...q, store: s.shortName, num: String(si + 1).padStart(2, "0") });
    });
  }
  return out;
}
