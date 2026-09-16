import type { Metadata } from "next";
import Link from "next/link";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { PlaceButton } from "@/components/site/PlaceButton";
import { StickyCta } from "@/components/site/StickyCta";
import { BRAND } from "@/lib/config";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import { placeSheetStores } from "@/lib/place-stores";
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

/** 이용 안내 — 제목, 순서 넷, 규칙 한 줄, 자주 묻는 질문 일곱. 아래 고정 버튼은 플레이스 시트. */
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
          <p className={styles.bookRow}>
            {ORDERED.map((s) => {
              const l = placeLinks(s);
              return l ? (
                <a key={s.id} href={l.booking} target="_blank" rel="noopener noreferrer" className="btn btn-naver btn-sm">
                  {s.course.n}차 {s.shortName}
                </a>
              ) : null;
            })}
          </p>
        </>
      ),
    },
    { id: "use", q: "다른 매장에서 어떻게 써요?", a: <p><Link href="/wallet">쿠폰함</Link>에서 갈 매장의 혜택을 고르고, 그 매장에서 메인안주 1개 주문할 때 직원에게 보여 줘요.</p> },
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
                  <b className="neon">{s.shortName}</b> {text}
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
      <section className="section"><div className="wrap">
        <h1 className="h1-event">이용 안내</h1>
        <p className={`cap ${styles.brand}`}>{BRAND.name} · {BRAND.eventTag}</p>
      </div></section>

      <div className="band" />
      <section className="section" aria-labelledby="steps-title"><div className="wrap">
        <div className="section-h">
          <h2 id="steps-title" className="h2-event">순서</h2>
          <span className="more">{BRAND.course}</span>
        </div>
        <ol>
          {STEP_LINES.map((text, i) => (
            <li key={text} className="row">
              <span className={`num ${styles.num}`} aria-hidden="true">{i + 1}</span>
              <div className="body">
                <p className="title"><span className="sr-only">{i + 1}. </span>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className={`cap ${styles.rule}`}>{ruleLine(rules)} · {BRAND.condition}</p>
      </div></section>

      <div className="band" />
      <section className="section" aria-labelledby="faq-title"><div className="wrap">
        <div className="section-h"><h2 id="faq-title" className="h2-event">자주 묻는 질문</h2></div>
        <GuideFaq items={items} />
      </div></section>

      <StickyCta>
        <PlaceButton stores={placeSheetStores()} className="btn btn-naver btn-block">네이버 플레이스에서 보기</PlaceButton>
      </StickyCta>
    </div>
  );
}
