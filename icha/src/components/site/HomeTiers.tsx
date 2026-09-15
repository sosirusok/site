import Link from "next/link";
import { formatWon, type Rules } from "@/lib/config";
import { ArrowIcon } from "@/components/ui/icons";
import styles from "./HomeTiers.module.css";

export function HomeTiers({ rules }: { rules: Rules }) {
  const tiers = rules.tiers;
  const sentence = tiers.map((t) => `${formatWon(t.minSpend)}부터 ${t.name}`).join(", ");
  return (
    <div className={styles.root}>
      <p className={`lead rise ${styles.copy}`}>
        인증한 영수증 금액이 쌓이면 등급이 올라요. 누적 {sentence}. 등급별로 사장님들이 쿠폰을 더 넣어 드릴 때가 있는데, 따로 신청할 건 없고 쿠폰함에 들어와요.
      </p>
      <ol className={`rise rise-d1 ${styles.ladder}`}>
        <li className={`${styles.rung} ${styles.base}`}>
          <span className={`serif ${styles.tierName}`}>일반</span>
          <span className={`mono ${styles.tierAmt}`}>처음 인증부터</span>
        </li>
        {tiers.map((t) => (
          <li key={t.key} className={styles.rung}>
            <span className={`serif ${styles.tierName}`}>{t.name}</span>
            <span className={`mono ${styles.tierAmt}`}>누적 {formatWon(t.minSpend)}부터</span>
          </li>
        ))}
      </ol>
      <p className={`rise rise-d2 ${styles.foot}`}>
        <Link href="/wallet" className={styles.link}>내 등급과 다음 등급까지 남은 금액 보기 <ArrowIcon size={16} /></Link>
      </p>
    </div>
  );
}
