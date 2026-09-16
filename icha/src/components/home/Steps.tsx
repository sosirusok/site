import { Art } from "@/components/art/Art";
import type { Rules } from "@/lib/config";
import styles from "./Steps.module.css";

const STEPS = [
  { art: "how-1", text: "영수증을 찍어 올려요" },
  { art: "how-2", text: "옆집 두 곳 중 한 곳을 골라요" },
  { art: "how-3", text: "직원에게 보여 주고 받아요" },
];

/** 이용 방법: 그림 세 장을 가로로, 아래에 번호와 한 줄씩 */
export function Steps({ rules }: { rules: Rules }) {
  return (
    <section id="how" className={`section ${styles.section}`} aria-labelledby="how-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-receipt" width={36} />
          <h2 id="how-title" className="h2">이렇게 해요</h2>
        </div>
        <ol className={styles.row}>
          {STEPS.map((s, i) => (
            <li key={s.art} className={styles.step}>
              <div className={styles.artBox}>
                <Art name={s.art} sizes="(min-width: 760px) 240px, 30vw" className={styles.art} />
              </div>
              <b className={styles.no}>{i + 1}</b>
              <p className={styles.text}>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className={styles.small}>
          <span>계산하고 {rules.receiptValidHours}시간 안</span> · <span>하루 {rules.dailyLimitPerMember}장까지</span> · <span>쿠폰은 {rules.couponValidDays}일 동안</span>
        </p>
      </div>
    </section>
  );
}
