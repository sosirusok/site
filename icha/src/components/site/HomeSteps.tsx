import { formatWon, type Rules } from "@/lib/config";
import { STORES } from "@/lib/stores";
import styles from "./HomeSteps.module.css";

/** 이용 방법 — 번호 1~4 와 짧은 설명. 값은 운영 규칙(getRules)에서 온다. */
export function HomeSteps({ rules }: { rules: Rules }) {
  const names = STORES.map((s) => s.shortName).join(", ");
  const min = rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상 ` : "";
  const steps: { title: string; desc: string }[] = [
    {
      title: "참여 매장에서 결제",
      desc: `${names} 중 한 곳에서 ${min}결제합니다. 카드 영수증과 현금영수증 모두 인정됩니다.`,
    },
    {
      title: "영수증 사진 인증",
      desc: `결제 후 ${rules.receiptValidHours}시간 안에 영수증 사진을 올립니다. 전화번호만 입력하면 되며, 1인당 하루 ${rules.dailyLimitPerMember}장까지 인정됩니다.`,
    },
    {
      title: "다른 매장 사이드 메뉴 선택",
      desc: "영수증을 받은 매장을 제외한 두 매장의 무료 사이드 메뉴 중 1개를 고릅니다. 쿠폰은 입력한 전화번호의 쿠폰함에 보관됩니다.",
    },
    {
      title: "매장에서 직원 확인 후 쿠폰 사용",
      desc: `주문할 때 직원에게 쿠폰 화면을 보여 주고, 직원 확인 후 [사용 처리]를 누릅니다. 쿠폰은 발급일부터 ${rules.couponValidDays}일간 유효합니다.`,
    },
  ];
  return (
    <ol className={styles.list}>
      {steps.map((s, i) => (
        <li key={s.title} className={styles.step}>
          <span className={styles.num} aria-hidden="true">{i + 1}</span>
          <div className={styles.body}>
            <h3 className={styles.title}>
              <span className="sr-only">{i + 1}. </span>
              {s.title}
            </h3>
            <p className={styles.desc}>{s.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
