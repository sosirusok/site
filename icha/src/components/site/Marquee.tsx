import styles from "./Marquee.module.css";

/**
 * 테이프처럼 흐르는 띠. 금색 바탕에 검정 글자(기본) 또는 빨간 바탕에 흰 글자.
 * 순수 CSS 애니메이션. 장식이므로 aria-hidden.
 */
export function Marquee({ items, tone = "gold", tilt = false, speed = 38 }: { items: string[]; tone?: "gold" | "red"; tilt?: boolean; speed?: number }) {
  const group = (k: string) => (
    <div className={styles.group} key={k}>
      {items.map((t, i) => (
        <span key={`${k}-${i}`} className={styles.item}>{t}</span>
      ))}
    </div>
  );
  const band = (
    <div className={`${styles.band} ${tone === "red" ? styles.red : ""} ${tilt ? styles.tilt : ""}`} aria-hidden="true">
      <div className={styles.track} style={{ animationDuration: `${speed}s` }}>
        {group("a")}
        {group("b")}
      </div>
    </div>
  );
  // 기울인 띠는 화면 폭보다 넓어지므로 가로 스크롤이 생기지 않게 감싼다
  return tilt ? <div className={styles.tiltWrap}>{band}</div> : band;
}
