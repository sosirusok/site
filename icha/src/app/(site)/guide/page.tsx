import type { Metadata } from "next";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { formatWon } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 안내",
  description: "영수증을 올리는 방법, 되는 영수증과 안 되는 영수증, 쿠폰을 쓰는 방법을 짧게 설명해요.",
};

export default async function GuidePage() {
  const rules = await getRules();
  const drinks = STORES.map((s) => s.drink).join("·");
  const h = rules.receiptValidHours;
  const days = rules.couponValidDays;
  const ruleLine = [
    `계산 후 ${h}시간 안`,
    rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상` : null,
    `하루 ${rules.dailyLimitPerMember}장`,
    `쿠폰 ${days}일`,
  ].filter(Boolean);

  const steps = ["계산하고 영수증을 찍어 올려요", "나머지 두 집 중 한 곳을 골라요", "그 집 직원에게 보여 주고 받아요"];

  const faq: FaqItem[] = [
    {
      id: "which-receipt",
      icon: "icon-receipt",
      q: "어떤 영수증이 되나요?",
      a: <p>세 집 중 어디서 계산했든 돼요. 카드 전표든 현금영수증이든 괜찮아요.</p>,
    },
    {
      id: "not-accepted",
      icon: "icon-error",
      q: "안 되는 경우는요?",
      a: (
        <>
          <ul className={styles.fails}>
            <li><Art name="status-photo-fail" width={56} /><span>흐리거나 잘린 사진</span></li>
            <li><Art name="status-wrong-store" width={56} /><span>다른 가게 영수증</span></li>
            <li><Art name="status-used" width={56} /><span>이미 올린 영수증</span></li>
          </ul>
          <p>주문서(빌지)·재출력본·화면을 다시 찍은 사진도 안 돼요.</p>
        </>
      ),
    },
    {
      id: "review",
      icon: "status-checking",
      q: "'직원 확인 대기'는 뭐예요?",
      a: <p>글자가 흐려 자동으로 못 읽으면 직원이 사진을 직접 봐요. 결과는 <Link href="/wallet">쿠폰함</Link>에서 볼 수 있어요.</p>,
    },
    {
      id: "how-to-use",
      icon: "icon-ok",
      q: "쿠폰은 어떻게 쓰나요?",
      a: <p>주문할 때 쿠폰 화면을 보여 주고, 직원이 확인하면 '사용하기'를 길게 눌러요. 미리 누르면 못 쓰니 꼭 직원 앞에서요.</p>,
    },
    {
      id: "phone-login",
      icon: "icon-phone",
      q: "왜 전화번호만 받나요?",
      a: <p>인증 문자 없이 바로 시작하려고요. 쿠폰은 그 번호에 보관되니 잘못 넣지 않게 한 번 더 봐 주세요.</p>,
    },
    {
      id: "photos",
      icon: "icon-history",
      q: "사진은 어떻게 보관되나요?",
      a: <p>같은 영수증을 두 번 쓰는지 확인하는 데만 쓰고 90일 뒤에 지워요. 매장 관리자 말고는 볼 수 없어요.</p>,
    },
  ];

  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.heroArt}>
          <Art name="hero-graphic" sizes="(min-width: 760px) 340px, 50vw" priority />
        </div>
        <div className={styles.heroText}>
          <h1 className="display">이용 안내</h1>
          <p>한 집 영수증으로 다른 두 집에서 한 잔을 드려요. <span className={styles.nowrap}>{drinks}</span> 중 하나예요.</p>
          <ArtButton kind="start" href="/verify" width={280} />
        </div>
      </header>
      <p className={styles.rules}>{ruleLine.join(" · ")}</p>

      <section className={styles.section} aria-labelledby="steps-title">
        <h2 id="steps-title" className={`h2 ${styles.h}`}>순서</h2>
        <ol className={styles.steps}>
          {steps.map((text, i) => (
            <li key={text} className={styles.step}>
              <span className={styles.stepArt}>
                <Art name={`how-${i + 1}`} sizes="56px" />
                <span className={styles.no}>{i + 1}</span>
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <h2 id="faq-title" className={`h2 ${styles.h}`}>궁금한 것</h2>
        <GuideFaq items={faq} />
      </section>

      <div className={styles.cta}>
        <ArtButton kind="start" href="/verify" width={300} />
      </div>
    </div>
  );
}
