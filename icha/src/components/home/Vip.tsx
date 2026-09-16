import { Art } from "@/components/art/Art";
import { formatWon, type Rules } from "@/lib/config";
import styles from "./Vip.module.css";

export function Vip({ rules }: { rules: Rules }) {
  const tiers = rules.tiers
    .map((t, i) => (i === 0 ? `누적 ${formatWon(t.minSpend)}부터 ${t.name}` : `${formatWon(t.minSpend)} ${t.name}`))
    .join(", ");
  return (
    <section id="vip" className={`section ${styles.section}`} aria-labelledby="vip-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-vip" width={36} />
          <h2 id="vip-title" className="h2">자주 오면 VIP</h2>
        </div>
        <div className={styles.body}>
          <Art name="vip-symbol" alt="" width={64} className={styles.symbol} />
          <p className={styles.text}>세 집 합쳐 {tiers}. 등급이 오르면 쿠폰이 따로 들어가요.</p>
        </div>
      </div>
    </section>
  );
}
