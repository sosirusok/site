import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { BRAND, type Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

/**
 * 첫 화면 — 레이브 플라이어의 표지.
 * 사장님 포스터 키비주얼(1080x900)을 화면 폭 가득 → 포스터 아랫단을 물고 올라오는 66px Black Han Sans 간판 글자(네온 번짐)
 * — 포스터 위에 영문 띠를 얹으면 세 가게 간판을 가린다. 그 문구는 아래 마키가 이미 흘린다.
 * → 초록 예약 바(가장 큼) + 네온 아웃라인 쿠폰함(작음) → 조건 한 줄(잔글씨).
 * 라벨-값 스펙 시트는 쓰지 않는다 — 참여 매장은 바로 아래 섹션이, 기간은 이용 안내가 말한다.
 * 글자는 전부 HTML 이다(이미지에 구운 글자 없음).
 */
export function Hero({ rules }: { rules: Rules }) {
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
        <p className={`lead ${s.introLead}`}>1차 맥주, 2차 막걸리, 3차 소주. 세 집이 50m 안에 붙어 있습니다. 한 집에서 마시면 다음 집 혜택이 열립니다.</p>

        <Button href="#stores" variant="naver" size="lg" block className={s.bookBtn}>매장 예약하기 →</Button>
        <div className={s.subCtas}>
          <Button href="/wallet" variant="outline">내 쿠폰함</Button>
          <Button href="/guide" variant="ghost">이용 안내</Button>
        </div>

        <p className={`fineprint ${s.rule}`}>{ruleLine(rules)} · 계산할 때 번호만 말씀해 주세요</p>
      </div>
    </section>
  );
}

/** 사이트에 하나뿐인 마키 — 히어로와 매장 사이의 형광 띠. 실제 주점 사이트(간빠맥주·당나발포차)가 쓰는 장치 */
export function HeroMarquee() {
  const run = (
    <span className="marquee-track" aria-hidden="true">
      <span className="ko">먹고 마시고 또 가자!</span><span>★</span>
      <span className="ko">오늘 서면에서 알콜부시기!</span><span>★</span>
      <span className="ko">좋은 술, 좋은 음식, 좋은 사람</span><span>★</span>
      <span className="ko">50m 안에서 1차·2차·3차</span><span>★</span>
    </span>
  );
  return (
    <div className="marquee torn-b2 inked inked-b" role="presentation">
      <span className="sr-only">{BRAND.slogan}</span>
      {run}
      {run}
    </div>
  );
}
