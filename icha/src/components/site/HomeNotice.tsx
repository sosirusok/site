import styles from "./HomeNotice.module.css";

/** 관리자 공지(rules.notice)가 있을 때만 상단에 얇게. */
export function HomeNotice({ text }: { text: string }) {
  const t = text.trim();
  if (!t) return null;
  return (
    <div className={styles.band} role="status">
      <div className={`wrap ${styles.inner}`}>
        <span className={`serif ${styles.label}`}>공지</span>
        <p className={`mono ${styles.text}`}>{t}</p>
      </div>
    </div>
  );
}
