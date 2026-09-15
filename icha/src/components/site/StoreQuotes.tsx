import type { Store } from "@/lib/stores";
import styles from "./StoreQuotes.module.css";

export function StoreQuotes({ quotes }: { quotes: Store["quotes"] }) {
  const list = quotes.slice(0, 3);
  if (!list.length) return null;
  return (
    <ul className={styles.list}>
      {list.map((q, i) => (
        <li key={i} className={`rise rise-d${Math.min(i + 1, 4)} ${styles.item}`}>
          <blockquote className={styles.quote}>
            <span className={`serif ${styles.mark}`} aria-hidden="true">“</span>
            <p className={`serif ${styles.text}`}>{q.text}</p>
            <footer className={`mono ${styles.foot}`}>방문자 리뷰 · {q.date}</footer>
          </blockquote>
        </li>
      ))}
    </ul>
  );
}
