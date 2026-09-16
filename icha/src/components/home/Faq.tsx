import Link from "next/link";
import type { Rules } from "@/lib/config";
import styles from "./Faq.module.css";

export function Faq({ rules }: { rules: Rules }) {
  const qa = [
    ["영수증을 받은 집에서는 왜 안 되나요?", "이 이벤트는 '한 집에서 먹었으면 옆집도 가 보자'는 뜻으로 세 집이 같이 하는 거라, 영수증을 받은 집 쿠폰은 나오지 않아요. 나머지 두 집 것을 골라 주세요."],
    ["어떤 영수증이 되나요?", `세 집의 결제 영수증이에요. 카드 매출전표, 현금영수증 모두 괜찮아요. 주문서(빌지), 재출력본, 화면을 찍은 사진은 인정되지 않아요. 결제하고 ${rules.receiptValidHours}시간 안에 올려 주세요.`],
    ["사진이 흐려서 자동으로 안 됐어요.", "'직원 확인 대기'로 바뀌고, 매장에서 사진을 보고 승인해 줘요. 보통 영업 중에 몇 분 안에 처리돼요. 승인되면 쿠폰함에서 바로 고를 수 있어요."],
    ["쿠폰은 언제까지 쓸 수 있나요?", `받은 날부터 ${rules.couponValidDays}일이에요. 한 번 쓰면 다시 쓸 수 없고, 직원 앞에서 '사용하기'를 눌러 주세요.`],
  ];
  return (
    <section className={`section ${styles.section}`} aria-labelledby="faq-title">
      <div className="wrap">
        <h2 id="faq-title" className="h2">자주 묻는 것</h2>
        <dl className={styles.list}>
          {qa.map(([q, a]) => (
            <div key={q} className={styles.item}>
              <dt>{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>
        <Link href="/guide" className="btn btn-outline">이용 안내 전체 보기</Link>
      </div>
    </section>
  );
}
