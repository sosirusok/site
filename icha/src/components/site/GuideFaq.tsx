import type { ReactNode } from "react";
import styles from "./GuideFaq.module.css";

export type FaqItem = { id: string; q: string; a: ReactNode };

/** 자주 묻는 질문 — 스크립트 없이 여닫는 details/summary. 선으로만 구분. */
export function GuideFaq({ items, openFirst = true }: { items: FaqItem[]; openFirst?: boolean }) {
  return (
    <ol className={styles.list}>
      {items.map((it, i) => (
        <li key={it.id} className={styles.item}>
          <details className={styles.details} id={it.id} open={openFirst && i === 0}>
            <summary className={styles.summary}>
              <span className={styles.q}>Q. {it.q}</span>
              <span className={styles.plus} aria-hidden="true" />
            </summary>
            <div className={styles.a}>{it.a}</div>
          </details>
        </li>
      ))}
    </ol>
  );
}
