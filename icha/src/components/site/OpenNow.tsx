"use client";
import type { Store } from "@/lib/stores";
import { heroStatus, type HeroStatus } from "./StoreHelpers";
import styles from "./StoreHero.module.css";
import { useClock } from "./useClock";

function useHeroStatus(hours: Store["hours"], initial: HeroStatus): HeroStatus {
  const now = useClock();
  return now ? heroStatus({ hours }, now) : initial;
}

/** StoreHero 의 영업 줄(상태 · 오늘 시간 · 주문 마감) */
export function OpenNow({ hours, initial }: { hours: Store["hours"]; initial: HeroStatus }) {
  const v = useHeroStatus(hours, initial);
  return (
    <p className={styles.statusBar}>
      <span className={`badge ${v.open ? "dot-on" : "dot-off"} ${styles.statusBadge}`}>{v.state}</span>
      <span className={`num ${styles.statusHours}`}>{v.today}</span>
      {v.lastOrder && <span className={styles.statusLo}>주문 마감 {v.lastOrder}</span>}
    </p>
  );
}

/** 오늘이 아닌 요일의 영업시간 — 자정이 지나면 요일이 바뀐다 */
export function OtherDays({ hours, initial }: { hours: Store["hours"]; initial: HeroStatus }) {
  const v = useHeroStatus(hours, initial);
  return v.otherDays.length > 0 ? <p className={`num ${styles.other}`}>{v.otherDays.join(" · ")}</p> : null;
}
