import type { Metadata } from "next";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { StickyCta } from "@/components/site/StickyCta";
import { BRAND } from "@/lib/config";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import { getRules } from "@/lib/settings";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 안내",
  description: `${BRAND.name} ${BRAND.eventTag} — 영수증을 올리는 순서, 되는 영수증, 특별 혜택 쿠폰 쓰는 법을 짧게 설명해요.`,
};

/** 순서 4줄 옆에 붙는 그림 — 3번째 줄(주문·쿠폰 보여 주기)은 그림 없이 번호만 */
const STEP_ART: (string | null)[] = ["how-1", "how-2", null, "how-3"];

/** 이용 안내 — 이벤트 이름, 규칙 한 줄, 순서 넷, 자주 묻는 질문 다섯. 시작 버튼은 화면 아래 고정. */
export default async function GuidePage() {
  const rules = await getRules();
  const h = rules.receiptValidHours;
  const days = rules.couponValidDays;
  const whenLine = rules.sameDayOnly ? "당일 영수증만 돼요" : `계산하고 ${h}시간 안에 올려 주세요`;

  const stepSubs = [whenLine, "영수증을 받은 집은 빼고요", "직원이 보는 앞에서 '사용하기'를 눌러요", `쿠폰은 ${days}일 동안 쓸 수 있어요`];

  const faq: FaqItem[] = [
    { id: "which", q: "어떤 영수증이 되나요?", a: <p>세 집 중 한 곳에서 계산한 영수증이에요. {whenLine}.</p> },
    { id: "no", q: "안 되는 영수증은요?", a: <p>흐리거나 잘린 사진, 다른 가게 영수증, 이미 올린 영수증, 주문서는 안 돼요.</p> },
    { id: "where", q: "쿠폰은 어디서 쓰나요?", a: <p>영수증을 받은 집 말고 50m 안 나머지 두 집 중 한 곳이에요. 받은 날부터 {days}일 안에 쓰면 돼요.</p> },
    { id: "how", q: "쿠폰은 어떻게 쓰나요?", a: <p>메인안주 1개 주문 시 받아요. 직원에게 쿠폰 화면을 보여 주고, 직원이 보는 앞에서 &lsquo;사용하기&rsquo;를 눌러요.</p> },
    { id: "wait", q: "'확인 중'은 뭐예요?", a: <p>글자가 흐려 바로 못 읽으면 직원이 사진을 직접 봐요. 결과는 <Link href="/wallet">쿠폰함</Link>에서 볼 수 있어요.</p> },
  ];

  return (
    <div className={styles.page}>
      <section className="section"><div className="wrap">
        <h1 className="h1-event">이용 안내</h1>
        <p className={`cap ${styles.brand}`}>{BRAND.name} · {BRAND.eventTag}</p>
        <p className={`lead ${styles.lead}`}>한 매장 영수증으로 50m 안 다른 매장에서 특별 혜택을 받아요.</p>
      </div></section>

      <div className="band" />
      <section className="section" aria-labelledby="steps-title"><div className="wrap">
        <div className="section-h">
          <h2 id="steps-title" className="h2-event">순서</h2>
          <span className="more">{BRAND.course}</span>
        </div>
        <ol className={styles.steps}>
          {STEP_LINES.map((text, i) => {
            const artName = STEP_ART[i];
            return (
              <li key={text} className="row">
                <span className={`num ${styles.num}`} aria-hidden="true">{i + 1}</span>
                <div className="body">
                  <p className="title"><span className="sr-only">{i + 1}. </span>{text}</p>
                  <p className="sub">{stepSubs[i]}</p>
                </div>
                {artName && <span className={styles.icon} aria-hidden="true"><Art name={artName} width={48} /></span>}
              </li>
            );
          })}
        </ol>
        <p className={`cap ${styles.rule}`}>{ruleLine(rules)}</p>
        <p className="cap">{BRAND.condition}</p>
      </div></section>

      <div className="band" />
      <section className="section" aria-labelledby="faq-title"><div className="wrap">
        <div className="section-h"><h2 id="faq-title" className="h2-event">자주 묻는 질문</h2></div>
        <GuideFaq items={faq} />
      </div></section>

      <StickyCta href="/verify">영수증 인증하기</StickyCta>
    </div>
  );
}
