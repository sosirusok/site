import type { CSSProperties, ReactNode } from "react";
import styles from "./GuideFaq.module.css";

export type FaqItem = {
  id: string;
  q: string;
  a: ReactNode;
};

/** 자주 묻는 질문 — 종이 카드 한 장씩(번갈아 1도 기울임), 스크립트 없이 여닫는 details. 질문은 명사구(Do Hyeon), 답은 합니다체 본문 글꼴 15px. */
export function GuideFaq({ items }: { items: FaqItem[] }) {
  return (
    <ul className={styles.list}>
      {items.map((it, i) => (
        <li key={it.id} className={`paper ${styles.item}`} style={{ "--r": `${i % 2 ? 1 : -1}deg` } as CSSProperties}>
          <details className={styles.details} id={it.id}>
            <summary className={styles.summary}>
              <span className={`disp ${styles.q}`}>{it.q}</span>
              <span className={styles.plus} aria-hidden="true" />
            </summary>
            <div className={styles.a}>{it.a}</div>
          </details>
        </li>
      ))}
    </ul>
  );
}
