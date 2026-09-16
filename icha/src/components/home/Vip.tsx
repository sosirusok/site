import { Art } from "@/components/art/Art";
import type { Rules } from "@/lib/config";
import styles from "./Vip.module.css";

export function Vip({ rules }: { rules: Rules }) {
  const tiers = rules.tiers;
  return (
    <section id="vip" className={`section ${styles.section}`} aria-labelledby="vip-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-vip" width={42} />
          <h2 id="vip-title" className="h2">자주 오시면 VIP</h2>
        </div>
        <div className={styles.body}>
          <div className={styles.card}>
            <Art name="vipcard-12" alt="VIP 카드" sizes="(min-width: 760px) 360px, 80vw" />
          </div>
          <div className={styles.text}>
            <p>
              인증한 영수증의 결제 금액이 전화번호에 쌓여요. 세 집 어디서 쓰든 합산되고, 기준 금액을 넘으면 등급이 올라가요.
              등급이 오르면 사장님들이 정한 시기에 쿠폰이 따로 들어가고, 따로 신청할 건 없어요.
            </p>
            <ul className={styles.tiers}>
              {tiers.map((t) => (
                <li key={t.key}>
                  <span className={styles.tierName}>{t.name}</span>
                  <span className={styles.dots} aria-hidden="true" />
                  <span className={styles.tierAmt}>누적 {(t.minSpend / 10000).toLocaleString("ko-KR")}만원부터</span>
                </li>
              ))}
            </ul>
            <p className={styles.small}>내 누적 금액과 등급은 쿠폰함에서 볼 수 있어요.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
