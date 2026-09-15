import type { ReactNode } from "react";
import styles from "./HomeSectionHead.module.css";

/**
 * 섹션 머리 — 작은 금색 말머리 + Black Han Sans 제목(키워드만 금색) + 한 줄 설명.
 * title 안에서 <em> 을 쓰면 금색이 된다.
 */
export function SectionHead({
  eyebrow,
  title,
  sub,
  id,
  align = "left",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  id?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
}) {
  return (
    <header className={`${styles.head} ${align === "center" ? styles.center : ""} rise`}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <Tag id={id} className={`h1 ${styles.title}`}>{title}</Tag>
      {sub && <p className={`lead ${styles.sub}`}>{sub}</p>}
    </header>
  );
}
