import styles from "./HomeSectionHead.module.css";

/** 섹션 머리: 왼쪽 굵은 괘선 + 번호(mono) + 제목(세리프). 홈/매장/안내 공통. */
export function SectionHead({ num, title, sub, id, as: Tag = "h2" }: { num?: string; title: string; sub?: string; id?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <header className={`${styles.head} rise`} id={id}>
      <hr className="rule-thick" />
      <div className={styles.row}>
        {num && <span className={`mono ${styles.num}`}>{num}</span>}
        <Tag className={`h2 ${styles.title}`}>{title}</Tag>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
    </header>
  );
}
