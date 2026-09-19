import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { BRAND, type Rules } from "@/lib/config";
import { eventPeriodLine, ruleLine } from "@/lib/copy";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/**
 * 첫 화면 — 레이브 플라이어의 표지.
 * 사장님 포스터 키비주얼(1080x900)을 화면 폭 가득 → 포스터 아랫단을 물고 올라오는 66px Black Han Sans 간판 글자(네온 번짐)
 * — 포스터 위에 영문 띠를 얹으면 세 가게 간판을 가린다. 그 문구는 아래 마키가 이미 흘린다.
 * → 초록 예약 바(가장 큼) + 네온 아웃라인 쿠폰함(작음) → 조건 세 줄을 형광 라벨이 붙은 스펙 시트로.
 * 글자는 전부 HTML 이다(이미지에 구운 글자 없음).
 */
export function Hero({ rules }: { rules: Rules }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const facts = [
    { k: "BARS", t: "참여 매장", v: ordered.map((st) => `${st.course.n}차 ${st.shortName}`).join(" · "), tone: s.toneCyan, hi: false },
    { k: "RULE", t: "이용 조건", v: BRAND.condition, tone: s.toneMag, hi: false },
    { k: "COUPON", t: "쿠폰", v: `${ruleLine(rules)} · 계산 시 휴대폰 번호로 발급`, tone: s.toneLime, hi: true },
    // 기간은 관리자 설정에서 읽는다 — 날짜가 비어 있으면 "상시 운영 · 종료일은 매장 공지"로 나간다(날짜를 지어내지 않는다)
    { k: "PERIOD", t: "이벤트 기간", v: eventPeriodLine(rules), tone: s.toneCyan, hi: false },
  ];
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.kv}>
        <Image src="/images/event/poster-hero.jpg" alt={`${BRAND.name} 포스터 — 소주·맥주·막걸리, ${BRAND.unionName}, ${BRAND.course}. 1차 도쿄스탠드 서면, 2차 조선칼국수와 통막걸리 밀리오레점, 3차 와르르맨숀 서면`} width={1080} height={900} priority fetchPriority="high" sizes="(min-width: 480px) 480px, 100vw" className={s.kvImg} />
      </div>

      <div className={s.intro}>
        <h1 id="hero-title" className={`d1 ${s.title}`}>
          <span className={s.titleTop}>소주·맥주·막걸리</span>
          <span className={s.titleBig}>{BRAND.unionName}</span>
        </h1>
        <p className={`lead ${s.introLead}`}>한 매장에서 계산할 때 휴대폰 번호를 말씀하시면 쿠폰이 발급됩니다. 50m 안의 다른 매장에서 메인안주 1개를 주문하고 쿠폰을 보여 주시면 매장별 특별 혜택을 드립니다.</p>

        <Button href="#stores" variant="naver" size="lg" block className={s.bookBtn}>매장 예약하기</Button>
        <div className={s.subCtas}>
          <Button href="/wallet" variant="outline">내 쿠폰함</Button>
          <Button href="/guide" variant="ghost">이용 안내</Button>
        </div>

        <dl className={s.facts}>
          {facts.map((f) => (
            <div key={f.k} className={`${s.fact} ${f.tone} ${f.hi ? s.factHi : ""}`}>
              <dt className={s.factKey}><span className={s.factEn}>{f.k}</span><span className={s.factKo}>{f.t}</span></dt>
              <dd className={s.factVal}>{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** 사이트에 하나뿐인 마키 — 히어로와 매장 사이의 형광 띠. 실제 주점 사이트(간빠맥주·당나발포차)가 쓰는 장치 */
export function HeroMarquee() {
  const run = (
    <span className="marquee-track" aria-hidden="true">
      <span>ALCOHOL BUSIGI</span><span className="ko">★</span>
      <span className="ko">서면 3가게 콜라보</span><span>★</span>
      <span>SOJU / BEER / MAKGEOLLI</span><span className="ko">★</span>
      <span className="ko">50m 안에서 1차·2차·3차</span><span>★</span>
      <span>GOOD DRINKS GOOD PEOPLE</span><span className="ko">★</span>
    </span>
  );
  return (
    <div className="marquee" role="presentation">
      <span className="sr-only">{BRAND.slogan}</span>
      {run}
      {run}
    </div>
  );
}
