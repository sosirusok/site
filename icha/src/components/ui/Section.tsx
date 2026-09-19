import type { ReactNode } from "react";

type Props = {
  id?: string;
  /** 작은 영문 머리말("STORES") */
  eyebrow?: string;
  title?: ReactNode;
  lead?: ReactNode;
  /** 연회색 바탕 */
  alt?: boolean;
  /** 제목 줄 오른쪽 끝의 작은 링크·버튼 */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** 섹션 — 40px 위아래 여백, 머리말(영문 작은 글자) + 제목(22px) + 한 줄 설명. 흰 바탕과 연회색 바탕을 번갈아 쓴다. */
export function Section({ id, eyebrow, title, lead, alt = false, action, className = "", children }: Props) {
  const hid = id ? `${id}-title` : undefined;
  return (
    <section id={id} className={`section ${alt ? "section-alt" : ""} ${className}`} aria-labelledby={title ? hid : undefined}>
      {(title || eyebrow) && (
        <div className="section-head">
          <div className="section-head-text">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2 id={hid} className="h2">{title}</h2>}
            {lead && <p className="lead">{lead}</p>}
          </div>
          {action && <div className="section-head-action">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
