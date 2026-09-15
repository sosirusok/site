import type { ReactNode } from "react";
import styles from "./GuideFaq.module.css";

export type FaqItem = { id: string; q: string; a: ReactNode };

/** 자바스크립트 없이 여닫는 FAQ — details/summary. */
export function GuideFaq({ items, openFirst = true }: { items: FaqItem[]; openFirst?: boolean }) {
  return (
    <ol className={styles.list}>
      {items.map((it, i) => (
        <li key={it.id} className={`rise ${styles.item}`}>
          <details className={styles.details} id={it.id} open={openFirst && i === 0}>
            <summary className={styles.summary}>
              <span className={`mono ${styles.num}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className={`serif ${styles.q}`}>{it.q}</span>
              <span className={styles.plus} aria-hidden="true" />
            </summary>
            <div className={styles.a}>{it.a}</div>
          </details>
        </li>
      ))}
    </ol>
  );
}
