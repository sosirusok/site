import type { ReactNode } from "react";
import { Art } from "@/components/art/Art";
import styles from "./GuideFaq.module.css";

export type FaqItem = {
  id: string;
  q: string;
  a: ReactNode;
  /** 질문 앞에 놓는 사장님 아이콘 이름 (icon-receipt 등) */
  icon?: string;
};

/** 묻고 답하기 — 스크립트 없이 여닫는 details/summary. 질문 앞에 작은 그림, 사이는 선으로만. */
export function GuideFaq({ items, openFirst = true }: { items: FaqItem[]; openFirst?: boolean }) {
  return (
    <ol className={styles.list}>
      {items.map((it, i) => (
        <li key={it.id} className={styles.item}>
          <details className={styles.details} id={it.id} open={openFirst && i === 0}>
            <summary className={styles.summary}>
              <span className={styles.icon} aria-hidden="true">
                {it.icon && <Art name={it.icon} width={30} />}
              </span>
              <span className={styles.q}>{it.q}</span>
              <span className={styles.plus} aria-hidden="true" />
            </summary>
            <div className={styles.a}>{it.a}</div>
          </details>
        </li>
      ))}
    </ol>
  );
}
