import type { ReactNode } from "react";
import { Chevron } from "@/components/ui/Chevron";
import styles from "./GuideFaq.module.css";

export type FaqItem = {
  id: string;
  q: string;
  a: ReactNode;
};

/** 자주 묻는 질문 — 스크립트 없이 여닫는 details 목록. 질문은 굵게, 답은 두 줄 안에. */
export function GuideFaq({ items }: { items: FaqItem[] }) {
  return (
    <ul className={styles.list}>
      {items.map((it) => (
        <li key={it.id} className={styles.item}>
          <details className={styles.details} id={it.id}>
            <summary className={styles.summary}>
              <span className={styles.q}>{it.q}</span>
              <Chevron className={styles.chev} />
            </summary>
            <div className={styles.a}>{it.a}</div>
          </details>
        </li>
      ))}
    </ul>
  );
}
