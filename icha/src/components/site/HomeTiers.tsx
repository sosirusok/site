import type { Rules } from "@/lib/config";
import { CountUp } from "./HomeCountUp";
import { wonShort } from "./StoreHelpers";
import styles from "./HomeTiers.module.css";

/** 자주 오면 등급 — 기준 금액을 금색 큰 숫자로. */
export function HomeTiers({ rules }: { rules: Rules }) {
  const tiers = rules.tiers;
  if (!tiers.length) return null;
  return (
    <ol className={styles.list}>
      {tiers.map((t, i) => {
        const w = wonShort(t.minSpend);
        const num = Number(w.num.replace(/,/g, ""));
        return (
          <li key={t.key} className={`${styles.tier} rise rise-d${i + 1}`}>
            <p className={styles.name}>{t.name}</p>
            <p className={styles.amount}>
              <span className={styles.prefix}>누적</span>
              {Number.isFinite(num) && Number.isInteger(num) ? <CountUp value={num} className={`num ${styles.big}`} /> : <span className={`num ${styles.big}`}>{w.num}</span>}
              <span className={styles.unit}>{w.unit}</span>
            </p>
            <p className={styles.desc}>{i === 0 ? "부터 시작. 승인된 영수증 금액이 쌓여요." : i === tiers.length - 1 ? "이상. 사장님들이 챙기는 손님이에요." : "이상. 등급별로 쿠폰이 따로 나가요."}</p>
          </li>
        );
      })}
    </ol>
  );
}
