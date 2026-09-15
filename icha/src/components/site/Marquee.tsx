import { STORES } from "@/lib/stores";
import { DrinkIcon } from "@/components/ui/icons";
import styles from "./Marquee.module.css";

/** 세 매장 이름과 대표 술이 흐르는 띠. 순수 CSS 애니메이션. */
export function Marquee({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const items = STORES.map((s) => (
    <span key={s.id} data-store={s.id} className={styles.item}>
      <span className={styles.icon}><DrinkIcon drink={s.drink} size={22} /></span>
      <span className={`serif ${styles.name}`}>{s.shortName}</span>
      <span className={`mono ${styles.drink}`}>{s.drink}</span>
    </span>
  ));
  return (
    <div className={`${styles.band} ${tone === "paper" ? styles.paperTone : ""}`} aria-hidden="true">
      <div className={styles.track}>
        <div className={styles.group}>{items}</div>
        <div className={styles.group}>{items}</div>
        <div className={styles.group}>{items}</div>
        <div className={styles.group}>{items}</div>
      </div>
    </div>
  );
}
