import type { Metadata } from "next";
import Link from "next/link";
import { DotLine } from "@/components/flow/kit";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { KitPiece, SectionLabel, StickerButton } from "@/components/site/Kit";
import { BRAND } from "@/lib/config";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 안내",
  description: `${BRAND.name} ${BRAND.eventTag} 이용 방법 · 예약 · 쿠폰 발급과 사용 · 자주 묻는 질문`,
};

/** 1차 → 2차 → 3차 */
const ORDERED = [...STORES].sort((a, b) => a.course.n - b.course.n);

/** 세 매장을 아우르는 출구·도보 한 줄 — 숫자는 LOCATIONS 에서만 읽는다 */
function walkLine(): string {
  const v = ORDERED.map((s) => LOCATIONS[s.id]);
  const exits = Array.from(new Set(v.map((l) => l.exit))).join("·");
  const mins = v.map((l) => l.walkMin);
  const lo = Math.min(...mins);
  const hi = Math.max(...mins);
  return `서면역 ${exits}번 출구 도보 ${lo === hi ? `${lo}분` : `${lo}~${hi}분`}`;
}

/**
 * 이용 안내 — 키트 큰 제목판(label-guide 60px) + 손글씨 메모(note-again 140px, 획 그림자 + 가장자리 없는 어둠) + 어두운 띠 한 줄, 이렇게 받아요(label-howto) + 순서 네 칸(2×2) + 종이에 적은 이용 방법 넷,
 * 자주 묻는 질문(label-faq)은 종이 카드. 보케 위 글자는 어두운 띠 위 본문 글꼴뿐. 아래 고정 버튼 없음(탭에 플레이스).
 */
export default async function GuidePage() {
  const rules = await getRules();
  const days = rules.couponValidDays;
  const limit = rules.dailyLimitPerMember;
  const reviews = ORDERED.map((s) => ({ s, text: rules.reviewBenefit[s.id].trim() })).filter((x) => x.text !== "");

  const faq: (FaqItem | null)[] = [
    { id: "get", q: "쿠폰 발급 방법", a: <p>계산 시 직원에게 휴대폰 번호를 말씀하시면 해당 번호로 쿠폰이 발급됩니다.</p> },
    {
      id: "book",
      q: "예약 방법",
      a: (
        <>
          <p>네이버 예약으로 접수합니다.</p>
          <ul className={styles.bookRow}>
            {ORDERED.map((s, i) => {
              const l = placeLinks(s);
              return l ? (
                <li key={s.id} className={styles.bookItem} data-store={s.id}>
                  <span className={`plate plate-store plate-sm ${styles.bookName}`}>{s.course.n}차 {s.shortName}</span>
                  <StickerButton kind="book" size="sm" tilt={i % 2 ? 1 : -1} href={l.booking} suffix={` — ${s.shortName}`}>예약하기</StickerButton>
                </li>
              ) : null;
            })}
          </ul>
        </>
      ),
    },
    { id: "use", q: "쿠폰 사용 방법", a: <p><Link href="/wallet" className="link">쿠폰함</Link>에서 사용할 매장의 혜택을 선택한 뒤, 해당 매장에서 메인안주 1개 주문 시 직원에게 제시합니다.</p> },
    { id: "when", q: "쿠폰 유효기간", a: <p>발급일부터 {days}일. 휴대폰 번호 1개당 하루 {limit}장까지 발급됩니다.</p> },
    { id: "near", q: "매장 간 거리", a: <p>3개 매장 모두 50m 이내. {walkLine()}.</p> },
    reviews.length > 0
      ? {
          id: "review",
          q: "리뷰 이벤트",
          a: (
            <ul className={styles.revList}>
              {reviews.map(({ s, text }) => (
                <li key={s.id} data-store={s.id}>
                  <span className="plate plate-store plate-sm">{s.shortName}</span> {text}
                </li>
              ))}
            </ul>
          ),
        }
      : null,
    { id: "phone", q: "휴대폰 번호 이용 목적", a: <p>쿠폰 발급과 확인에만 사용합니다. 문자나 전화는 발송하지 않습니다.</p> },
    { id: "main", q: "메인안주 기준", a: <p>각 매장 메뉴판의 안주 1개. 해당 메뉴는 매장에서 확인해 주세요.</p> },
  ];
  const items = faq.filter((x): x is FaqItem => x !== null).slice(0, 7);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.titleRow}>
          <SectionLabel kind="guide" color="red" as="h1" big className={styles.h1}>이용 안내</SectionLabel>
          <KitPiece name="note-again" rotate={5} sizes="140px" className={`note-dark ${styles.note}`} />
        </div>
        <p className={`info ${styles.brand}`}>{BRAND.name} · {BRAND.eventTag}</p>
      </header>

      <section className={styles.sec} aria-labelledby="steps-title">
        <div className="sec-h">
          <SectionLabel kind="howto" color="blue" id="steps-title">이용 방법</SectionLabel>
          <p className={`info ${styles.lead}`}>{BRAND.course}</p>
        </div>
        <div className={`paper paper-l ${styles.stepPaper}`}>
          <ol className={styles.steps}>
            {STEP_LINES.map((text, i) => (
              <li key={text} className={styles.step}>
                <span className={`plate plate-yellow plate-sm ${styles.num}`} aria-hidden="true">{i + 1}</span>
                <p className={styles.stepT}><span className="sr-only">{i + 1}. </span>{text}</p>
              </li>
            ))}
          </ol>
          <p className={styles.rule}><DotLine items={[ruleLine(rules), BRAND.condition]} /></p>
        </div>
      </section>

      <section className={styles.sec} aria-labelledby="faq-title">
        <div className="sec-h">
          <SectionLabel kind="faq" color="green" id="faq-title" className={styles.faqLabel}>자주 묻는 질문</SectionLabel>
        </div>
        <GuideFaq items={items} />
      </section>
    </div>
  );
}
