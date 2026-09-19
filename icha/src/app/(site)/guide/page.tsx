import type { Metadata } from "next";
import Image from "next/image";
import { HowToSteps } from "@/components/home/HowToSteps";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { BRAND } from "@/lib/config";
import { eventPeriodLine } from "@/lib/copy";
import { faqItems } from "@/lib/faq";
import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import styles from "./page.module.css";

/** 정적(ISR) — 60초마다. 규칙을 저장하면 revalidatePath("/guide") */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "이용 안내",
  description: `${BRAND.name} ${BRAND.eventTag} 이용 방법 · 예약 · 쿠폰 발급과 사용 · 자주 묻는 질문`,
};

/** 1차 → 2차 → 3차 */
const ORDERED = [...STORES].sort((a, b) => a.course.n - b.course.n);

/** 이용 안내 — 제목 → 이용 방법(홈과 같은 네 단계) → 매장 예약(세 줄) → 자주 묻는 질문(전체) → 이벤트 포스터(원본 그림). */
export default async function GuidePage() {
  const rules = await getRules();
  const faq = faqItems(rules);
  const reviews = ORDERED.map((s) => ({ s, text: rules.reviewBenefit[s.id].trim() })).filter((x) => x.text !== "");

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <h1 className={`d1 ${styles.topTitle}`}>이용 안내</h1>
        <p className="lead">쿠폰을 받는 법과 쓰는 법입니다.</p>
        <p className={styles.period}>이벤트 기간 <b>{eventPeriodLine(rules)}</b></p>
      </header>

      <HowToSteps rules={rules} />

      <Section id="book" tone="lime" title="매장 예약" lead="네이버 예약으로 접수합니다" alt pt={52} pb={36}>
        <ul className={styles.bookList}>
          {ORDERED.map((s2) => {
            const l = placeLinks(s2);
            return (
              <li key={s2.id} className={styles.bookItem} data-store={s2.id}>
                <span className={styles.bookBand}>{s2.course.n}차 {s2.shortName}</span>
                <span className={styles.bookRow}>
                  <span className={styles.bookSub}>{LOCATIONS[s2.id].subway}</span>
                  {l && <Button href={l.booking} variant="naver" size="sm" srSuffix={` — ${s2.course.n}차 ${s2.shortName}`}>예약</Button>}
                </span>
              </li>
            );
          })}
        </ul>
        {reviews.length > 0 && (
          <div className={`box-brand ${styles.reviewBox}`}>
            <p className={styles.reviewTitle}>리뷰 이벤트</p>
            <ul className={styles.reviewList}>
              {reviews.map(({ s, text }) => <li key={s.id}><b>{s.shortName}</b> {text}</li>)}
            </ul>
          </div>
        )}
      </Section>

      <Section id="faq" head="slab" title="자주 묻는 질문" tone="lime" pt={44} pb={34}>
        <dl className={styles.faq}>
          {faq.map((it) => (
            <div key={it.id} className={styles.faqItem} id={it.id}>
              <dt className={styles.faqQ}>{it.q}</dt>
              <dd className={styles.faqA}>{it.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="poster" title="포스터 원본" lead="매장에 붙어 있는 그 포스터" tone="cyan" alt flush pt={46} pb={30}>
        <figure className={styles.poster}>
          <Image src="/images/event/poster.jpg" alt={`${BRAND.name} 포스터 — ${BRAND.unionName}, ${BRAND.eventTag}`} width={1080} height={1350} sizes="(min-width: 480px) 440px, calc(100vw - 40px)" className={styles.posterImg} />
        </figure>
      </Section>

      {/* 페이지가 사진으로 끝나면 만들다 만 화면처럼 보인다 — 라임 색면 하나로 닫고 다음 행동을 준다 */}
      <div className={styles.closer}>
        <p className={styles.closerTitle}>번호만 말씀하시면 쿠폰이 쌓입니다</p>
        <div className={styles.closerRow}>
          <Button href="/wallet" variant="dark" size="lg">내 쿠폰함 열기 →</Button>
          <Button href="/#stores" variant="darkline">참여 매장 보기</Button>
        </div>
      </div>
    </div>
  );
}
