import type { Metadata } from "next";
import Link from "next/link";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { SectionLabel, StickerButton } from "@/components/site/Kit";
import { Piece } from "@/components/site/Poster";
import { StepsStrip } from "@/components/site/StepsStrip";
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
  description: `${BRAND.name} ${BRAND.eventTag} — 예약, 쿠폰을 받는 순서, 다른 매장에서 쓰는 법을 짧게 설명해요.`,
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
  return `서면역 ${exits}번 출구에서 걸어서 ${lo === hi ? `${lo}분` : `${lo}~${hi}분`}`;
}

/** 이용 안내 — 간판 제목, 포스터 순서 조각 + 종이에 적은 순서 넷, 자주 묻는 질문은 종이 카드. 아래 고정 버튼 없음(탭에 플레이스). 제목 셋은 키트 label-guide/howto/faq 가 오면 그 그림. */
export default async function GuidePage() {
  const rules = await getRules();
  const days = rules.couponValidDays;
  const limit = rules.dailyLimitPerMember;
  const reviews = ORDERED.map((s) => ({ s, text: rules.reviewBenefit[s.id].trim() })).filter((x) => x.text !== "");

  const faq: (FaqItem | null)[] = [
    { id: "get", q: "쿠폰은 어떻게 받아요?", a: <p>계산할 때 직원에게 휴대폰 번호를 말해요. 쿠폰이 그 번호로 들어와요.</p> },
    {
      id: "book",
      q: "예약은 어떻게 해요?",
      a: (
        <>
          <p>네이버 예약으로 받아요.</p>
          <ul className={styles.bookRow}>
            {ORDERED.map((s, i) => {
              const l = placeLinks(s);
              return l ? (
                <li key={s.id} className={styles.bookItem} data-store={s.id}>
                  <span className={`plate plate-store plate-sm ${styles.bookName}`}>{s.course.n}차 {s.shortName}</span>
                  <StickerButton kind="book" size="sm" tilt={i % 2 ? 1 : -1} href={l.booking}>예약하기<span className="sr-only"> — {s.shortName}</span></StickerButton>
                </li>
              ) : null;
            })}
          </ul>
        </>
      ),
    },
    { id: "use", q: "다른 매장에서 어떻게 써요?", a: <p><Link href="/wallet" className="link">쿠폰함</Link>에서 갈 매장의 혜택을 고르고, 그 매장에서 메인안주 1개 주문할 때 직원에게 보여 줘요.</p> },
    { id: "when", q: "쿠폰은 언제까지?", a: <p>받은 날부터 {days}일 안에 써요. 한 번호로 하루 {limit}장까지 받을 수 있어요.</p> },
    { id: "near", q: "세 매장은 얼마나 떨어져 있어요?", a: <p>모두 50m 안이에요. {walkLine()}.</p> },
    reviews.length > 0
      ? {
          id: "review",
          q: "리뷰 이벤트가 있어요?",
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
    { id: "phone", q: "번호는 어디에 써요?", a: <p>쿠폰을 넣어 두고 찾는 데만 써요. 문자나 전화는 가지 않아요.</p> },
    { id: "main", q: "메인안주는 뭐예요?", a: <p>메뉴판의 안주 한 가지예요. 어떤 게 되는지는 매장에 물어보면 알려 줘요.</p> },
  ];
  const items = faq.filter((x): x is FaqItem => x !== null).slice(0, 7);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <SectionLabel kind="guide" color="red" as="h1" big className={styles.h1}>이용 안내</SectionLabel>
        <p className={`hand hand-w ${styles.brand}`}>{BRAND.name} · {BRAND.eventTag}</p>
        <Piece name="note-again" rotate={6} sizes="110px" className={styles.note} />
      </header>

      <section className={styles.sec} aria-labelledby="steps-title">
        <div className="sec-h">
          <SectionLabel kind="howto" color="blue" id="steps-title">순서</SectionLabel>
          <p className={`hand hand-w ${styles.lead}`}>{BRAND.course}</p>
        </div>
        <StepsStrip className={styles.strip} />
        <div className={`paper paper-l ${styles.stepPaper}`}>
          <ol className={styles.steps}>
            {STEP_LINES.map((text, i) => (
              <li key={text} className={styles.step}>
                <span className={`plate plate-yellow plate-sm ${styles.num}`} aria-hidden="true">{i + 1}</span>
                <p className={styles.stepT}><span className="sr-only">{i + 1}. </span>{text}</p>
              </li>
            ))}
          </ol>
          <p className={styles.rule}>{ruleLine(rules)} · {BRAND.condition}</p>
        </div>
      </section>

      <section className={styles.sec} aria-labelledby="faq-title">
        <div className="sec-h">
          <SectionLabel kind="faq" color="green" id="faq-title">자주 묻는 질문</SectionLabel>
          <p className={`hand hand-w ${styles.lead}`}>궁금한 것</p>
        </div>
        <GuideFaq items={items} />
      </section>
    </div>
  );
}
