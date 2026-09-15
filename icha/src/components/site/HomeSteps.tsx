import { formatWon, type Rules } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { DrinkIcon, ReceiptIcon, TicketIcon } from "@/components/ui/icons";
import styles from "./HomeSteps.module.css";

export function HomeSteps({ rules }: { rules: Rules }) {
  const names = STORES.map((s) => s.shortName);
  const steps = [
    {
      n: "1",
      title: "세 곳 중 한 곳에서 결제",
      body: `${names.join(", ")} 어디든 좋아요.${rules.minAmount > 0 ? ` ${formatWon(rules.minAmount)} 이상이면 돼요.` : ""} 영수증은 버리지 말고 챙겨 두세요.`,
      icon: (
        <span className={styles.icons}>
          {STORES.map((s) => (
            <span key={s.id} data-store={s.id} className={styles.icon}><DrinkIcon drink={s.drink} size={26} /></span>
          ))}
        </span>
      ),
    },
    {
      n: "2",
      title: "영수증 사진 인증",
      body: `결제 후 ${rules.receiptValidHours}시간 안에 사진을 찍어 올려요. 전화번호만 있으면 되고, 하루 ${rules.dailyLimitPerMember}장까지 인증할 수 있어요.`,
      icon: <span className={styles.icon}><ReceiptIcon size={26} /></span>,
    },
    {
      n: "3",
      title: "나머지 두 곳에서 사이드 한 접시",
      body: `영수증을 받은 매장 말고, 다른 두 곳 중 한 곳의 사이드 메뉴를 골라요. 쿠폰은 ${rules.couponValidDays}일 동안 쓸 수 있고, 직원 앞에서 '사용'을 누르면 끝이에요.`,
      icon: <span className={styles.icon}><TicketIcon size={26} /></span>,
    },
  ];
  return (
    <ol className={styles.list}>
      {steps.map((s, i) => (
        <li key={s.n} className={`rise rise-d${i + 1} ${styles.step}`}>
          <span className={`serif ${styles.num}`} aria-hidden="true">{s.n}</span>
          <div className={styles.body}>
            {s.icon}
            <h3 className={`serif ${styles.title}`}>
              <span className="sr-only">{s.n}단계. </span>{s.title}
            </h3>
            <p className={styles.text}>{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
