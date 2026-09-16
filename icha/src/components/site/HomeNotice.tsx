import styles from "./HomeNotice.module.css";

/** 관리자 공지 — 헤더 아래 검정 띠에 흰 글자 한 줄. 비어 있으면 그리지 않는다. */
export function HomeNotice({ text }: { text: string }) {
  const t = text.trim();
  if (!t) return null;
  return (
    <div className={styles.band} role="status">
      <p className={`wrap ${styles.text}`}>
        <span className={styles.label}>공지</span>
        {t}
      </p>
    </div>
  );
}
