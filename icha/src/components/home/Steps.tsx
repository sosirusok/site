import { Art } from "@/components/art/Art";
import type { Rules } from "@/lib/config";
import styles from "./Steps.module.css";

/** 이용 방법: 사장님 그림 3장을 길 따라 놓은 안내 */
export function Steps({ rules }: { rules: Rules }) {
  const steps = [
    {
      art: "how-1",
      title: "계산하고 받은 영수증을 찍어 올려요",
      text: `세 집 중 어디서든 좋아요. 결제하고 ${rules.receiptValidHours}시간 안에 영수증 사진을 올려 주세요. 상호, 결제 시각, 금액, 승인번호가 또렷하게 보이면 자동으로 확인돼요. ${rules.minAmount > 0 ? `${rules.minAmount.toLocaleString("ko-KR")}원 이상 결제한 영수증이면 되고, ` : ""}하루 ${rules.dailyLimitPerMember}장까지 받아요.`,
    },
    {
      art: "how-2",
      title: "옆집 두 곳 중 한 곳을 골라요",
      text: "영수증을 받은 집을 뺀 나머지 두 곳의 쿠폰이 보여요. 막걸리, 생맥주, 소주 중 마시고 싶은 쪽을 고르면 쿠폰이 전화번호 쿠폰함에 들어가요.",
    },
    {
      art: "how-3",
      title: "그 집에서 직원에게 보여 주고 받아요",
      text: `주문할 때 쿠폰 화면을 보여 주세요. 직원이 확인하면 화면의 '사용하기'를 눌러 주면 끝이에요. 쿠폰은 받은 날부터 ${rules.couponValidDays}일 동안 쓸 수 있어요.`,
    },
  ];
  return (
    <section id="how" className={`section ${styles.section}`} aria-labelledby="how-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-receipt" width={42} />
          <h2 id="how-title" className="h2">이렇게 해요</h2>
        </div>
        <ol className={styles.path}>
          {steps.map((s, i) => (
            <li key={s.art} className={`${styles.step} rise rise-d${i + 1}`}>
              <div className={styles.art}>
                <Art name={s.art} sizes="(min-width: 760px) 260px, 60vw" />
              </div>
              <div className={styles.text}>
                <span className={styles.no}>{i + 1}</span>
                <h3 className="h3">{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
