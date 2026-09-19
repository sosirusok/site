import type { Metadata } from "next";
import Image from "next/image";
import { HowToSteps } from "@/components/home/HowToSteps";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { BRAND } from "@/lib/config";
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
        <span className="eyebrow">Guide</span>
        <h1 className="h1">이용 안내</h1>
        <p className="lead">{BRAND.name} {BRAND.eventTag} — 쿠폰을 받는 법, 쓰는 법, 예약과 자주 묻는 질문입니다.</p>
      </header>

      <HowToSteps rules={rules} />

      <Section id="book" eyebrow="Reservation" title="매장 예약" lead="네이버 예약으로 접수합니다" alt>
        <ul className={styles.bookList}>
          {ORDERED.map((s) => {
            const l = placeLinks(s);
            return (
              <li key={s.id} className={styles.bookItem} data-store={s.id}>
                <span className="badge badge-store">{s.course.n}차</span>
                <span className={styles.bookBody}>
                  <span className={styles.bookName}>{s.shortName}</span>
                  <span className="small muted">{LOCATIONS[s.id].subway}</span>
                </span>
                {l && <Button href={l.booking} variant="naver" size="sm" srSuffix={` — ${s.shortName}`}>예약하기</Button>}
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

      <Section id="faq" eyebrow="FAQ" title="자주 묻는 질문">
        <ul className={styles.faq}>
          {faq.map((it) => (
            <li key={it.id}>
              <details className={styles.faqItem} id={it.id}>
                <summary className={styles.faqQ}>
                  <span>{it.q}</span>
                  <svg className={styles.faqIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
                </summary>
                <p className={styles.faqA}>{it.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="poster" eyebrow="Poster" title="이벤트 포스터" lead="매장에 붙어 있는 포스터 원본" alt>
        <figure className={`card ${styles.poster}`}>
          <Image src="/images/event/poster.jpg" alt={`${BRAND.name} 포스터 — ${BRAND.unionName}, ${BRAND.eventTag}`} width={1080} height={1350} sizes="(min-width: 480px) 440px, calc(100vw - 40px)" className={styles.posterImg} />
        </figure>
      </Section>
    </div>
  );
}
