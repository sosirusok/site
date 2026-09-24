import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { BRAND, type Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

const HERO_SPOTS = [
  { no: "01", label: "맥주", name: "도쿄스탠드", src: "/images/stores/tokyo/cold-ham-plate-beers.jpg", pos: "52% 50%" },
  { no: "02", label: "막걸리", name: "조선칼국수", src: "/images/stores/joseon/makgeolli-cheers.jpg", pos: "50% 48%" },
  { no: "03", label: "소주", name: "와르르맨숀", src: "/images/stores/wareureu/interior-stained-glass.jpg", pos: "50% 52%" },
] as const;

/** 첫 화면 — 실제 세 매장 사진과 라이브 타이포로 만든 서면 나이트라이프 에디토리얼. */
export function Hero({ rules }: { rules: Rules }) {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.intro}>
        <p className={s.eyebrow}><span className={s.liveDot} aria-hidden="true" />SEOMYEON NIGHT ROUTE <span>3 SPOTS · 50M</span></p>
        <h1 id="hero-title" className={s.title}>
          <span className={s.titleTop}>오늘 서면,</span>
          <span className={s.titleBig}>세 집</span>
          <span className={s.titleAccent}>부시기</span>
        </h1>
        <p className={s.introLead}>맥주로 시작해서 막걸리로 달리고, 소주로 마무리. 50m 안의 세 가게를 한 번에 즐기고 다음 집 혜택까지 챙기세요.</p>

        <div className={s.heroStats} aria-label="코스 요약">
          <span><b>3</b> SPOTS</span>
          <span><b>50</b> METERS</span>
          <span><b>1</b> NIGHT</span>
        </div>

        <div className={s.heroCtas}>
          <Button href="#stores" variant="primary" size="lg" className={s.primaryCta}>오늘 코스 보기 <span aria-hidden="true">↘</span></Button>
          <Button href="/wallet" variant="outline" size="lg" className={s.walletCta}>내 쿠폰함</Button>
        </div>
        <p className={s.rule}>{ruleLine(rules)} · 계산할 때 휴대폰 번호만 말씀해 주세요</p>
      </div>

      <div className={s.visual} aria-label="참여 매장 세 곳의 실제 모습">
        {HERO_SPOTS.map((spot, i) => (
          <figure key={spot.no} className={s.visualCard} data-spot={spot.no}>
            <Image
              src={spot.src}
              alt={`${spot.name} 실제 매장 사진`}
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : undefined}
              sizes="(min-width: 1100px) 390px, (min-width: 700px) 46vw, 78vw"
              style={{ objectPosition: spot.pos }}
              className={s.visualImg}
            />
            <figcaption className={s.visualCaption}>
              <span className={s.visualNo}>{spot.no}</span>
              <span><b>{spot.label}</b>{spot.name}</span>
            </figcaption>
          </figure>
        ))}
        <span className={s.visualStamp} aria-hidden="true">SEO MYEON<br />ALL NIGHT</span>
      </div>

      <a href="#stores" className={s.scrollCue}><span>SCROLL TO THE ROUTE</span><i aria-hidden="true" /></a>
    </section>
  );
}

/** 사이트에 하나뿐인 마키 — 히어로와 매장 사이의 나이트 루트 티커. */
export function HeroMarquee() {
  const run = (
    <span className="marquee-track" aria-hidden="true">
      <span>01 TOKYO STAND</span><span className="ko">맥주로 시작</span><span>✦</span>
      <span>02 JOSEON KALGUKSU</span><span className="ko">막걸리로 이어서</span><span>✦</span>
      <span>03 WARR MANSION</span><span className="ko">소주로 마무리</span><span>✦</span>
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
