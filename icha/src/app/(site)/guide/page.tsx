import type { Metadata } from "next";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import { getRules } from "@/lib/settings";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 안내",
  description: "영수증을 올리는 순서, 되는 영수증과 안 되는 영수증, 쿠폰 쓰는 법을 짧게 설명해요.",
};

/** 이용 안내 — 규칙 한 줄, 순서 셋, 자주 묻는 질문 다섯, 아래에 시작 버튼. */
export default async function GuidePage() {
  const rules = await getRules();
  const h = rules.receiptValidHours;
  const days = rules.couponValidDays;

  const stepSubs = [`계산하고 ${h}시간 안에요`, "영수증을 받은 집은 빼고요", `쿠폰은 ${days}일 동안 쓸 수 있어요`];

  const faq: FaqItem[] = [
    { id: "which", q: "어떤 영수증이 되나요?", a: <p>세 집 중 한 곳에서 계산한 영수증이면 돼요. 계산하고 {h}시간 안에 올려 주세요.</p> },
    { id: "no", q: "안 되는 영수증은요?", a: <p>흐리거나 잘린 사진, 다른 가게 영수증, 이미 올린 영수증, 주문서는 안 돼요.</p> },
    { id: "where", q: "쿠폰은 어디서 쓰나요?", a: <p>영수증을 받은 집 말고 나머지 두 집 중 한 곳이에요. 받은 날부터 {days}일 안에 쓰면 돼요.</p> },
    { id: "how", q: "쿠폰은 어떻게 쓰나요?", a: <p>주문할 때 직원에게 쿠폰 화면을 보여 주세요. 직원이 보는 앞에서 &lsquo;사용하기&rsquo;를 눌러요.</p> },
    { id: "wait", q: "'직원 확인 대기'는 뭐예요?", a: <p>글자가 흐려 바로 못 읽으면 직원이 사진을 직접 봐요. 결과는 <Link href="/wallet">쿠폰함</Link>에서 볼 수 있어요.</p> },
  ];

  return (
    <div className={styles.page}>
      <section className="section"><div className="wrap">
        <h1 className="h1">이용 안내</h1>
        <p className={`lead ${styles.rule}`}>{ruleLine(rules)}</p>
      </div></section>

      <div className="band" />
      <section className="section" aria-labelledby="steps-title"><div className="wrap">
        <div className="section-h"><h2 id="steps-title" className="h2">순서</h2></div>
        <ol>
          {STEP_LINES.map((text, i) => (
            <li key={text} className="row">
              <span className={styles.icon} aria-hidden="true"><Art name={`how-${i + 1}`} width={48} /></span>
              <div className="body">
                <p className="title">{i + 1}. {text}</p>
                <p className="sub">{stepSubs[i]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div></section>

      <div className="band" />
      <section className="section" aria-labelledby="faq-title"><div className="wrap">
        <div className="section-h"><h2 id="faq-title" className="h2">자주 묻는 질문</h2></div>
        <GuideFaq items={faq} />
        <Link href="/verify" className={`btn btn-block ${styles.cta}`}>영수증 인증하기</Link>
      </div></section>
    </div>
  );
}
