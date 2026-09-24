import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

const HERO_SPOTS = [
  { no: "01", drink: "생맥주", name: "도쿄스탠드", src: "/images/stores/tokyo/draft-tap.jpg", pos: "44% 50%" },
  { no: "02", drink: "막걸리", name: "조선칼국수", src: "/images/stores/joseon/makgeolli-cheers.jpg", pos: "50% 56%" },
  { no: "03", drink: "소주", name: "와르르맨숀", src: "/images/stores/wareureu/hero.jpg", pos: "50% 43%" },
] as const;

/** 첫 화면 — 효과 대신 실제 세 매장 사진과 직선 그리드로 만든 야간 취재면. */
export function Hero({ rules }: { rules: Rules }) {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroMeta}>
        <span>서면 6번 출구</span>
        <span>세 매장 · 도보 50m</span>
        <span>오늘 바로 사용</span>
      </div>

      <div className={s.heroIntro}>
        <h1 id="hero-title" className={s.title}>서면에서 <em>50m,</em><br />세 번의 건배.</h1>
        <div className={s.introCopy}>
          <p className={s.introLead}>도쿄스탠드에서 생맥주 한 잔, 조선칼국수에서 막걸리 한 사발, 와르르맨숀에서 소주로 마무리합니다.</p>
          <p className={s.introSub}>한 곳에서 계산하고 휴대폰 번호를 남기면, 다음 매장에서 쓸 혜택이 생깁니다.</p>
          <div className={s.heroCtas}>
            <Button href="#stores" variant="primary" size="lg" className={s.primaryCta}>세 집 코스 보기 <span aria-hidden="true">↓</span></Button>
            <Button href="/wallet" variant="outline" size="lg" className={s.walletCta}>내 쿠폰 확인 <span aria-hidden="true">→</span></Button>
          </div>
        </div>
      </div>

      <div className={s.visual} aria-label="참여 매장 세 곳의 실제 사진">
        {HERO_SPOTS.map((spot, i) => (
          <figure key={spot.no} className={s.visualCard} data-spot={spot.no}>
            <Image
              src={spot.src}
              alt={`${spot.name} 실제 매장 사진`}
              fill
              loading="eager"
              fetchPriority={i === 0 ? "high" : undefined}
              sizes="(min-width: 1100px) 34vw, (min-width: 700px) 34vw, 50vw"
              style={{ objectPosition: spot.pos }}
              className={s.visualImg}
            />
            <figcaption className={s.visualCaption}>
              <span className={s.visualNo}>{spot.no}</span>
              <span><b>{spot.name}</b>{spot.drink}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className={s.rule}><span>이용 조건</span>{ruleLine(rules)} · 계산할 때 휴대폰 번호만 말씀해 주세요.</p>
    </section>
  );
}
