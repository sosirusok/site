import Image from "next/image";
import { BRAND } from "@/lib/config";
import s from "./NightHero.module.css";

/**
 * 첫 장면 — 밤의 바 사진(맥주·소주·막걸리) 한 장 위에 포스터 글자.
 * 오른쪽 아래에는 가게 앞에 붙은 사장님 포스터를 그대로 비스듬히 붙였다.
 * 글은 포스터 문구 그대로: 알콜부시기 / 영수증 릴레이 EVENT / 50m 안에서 즐기는 1차·2차·3차 / 조건 한 줄.
 */
export function NightHero() {
  return (
    <section className={`frame bleed-top ${s.hero}`} aria-labelledby="event-title">
      <Image src="/images/neon/kv-bar.jpg" alt="" aria-hidden="true" fill priority sizes="(min-width: 480px) 480px, 100vw" className={s.shot} />
      <span className={`vignette ${s.layer}`} aria-hidden="true" />
      <span className={s.tint} aria-hidden="true" />
      <span className={`scrim ${s.layer}`} aria-hidden="true" />
      <span className={`grain ${s.layer}`} aria-hidden="true" />

      <div className={s.body}>
        <p className={`kicker on-photo ${s.kicker}`}>부산 서면 · 오늘 밤</p>
        <h1 id="event-title" className={`tube flicker ${s.title}`}>{BRAND.name}</h1>
        <p className={s.course3} aria-hidden="true"><span /><span /><span /></p>
        <p className={`on-photo ${s.tag}`}>{BRAND.eventTag}</p>
        <p className={`on-photo ${s.course}`}>{BRAND.course}</p>

        <div className={s.foot}>
          <p className={`on-photo ${s.cond}`}>
            <span className={s.condLead}>당일 영수증 한정</span>
            테이블당 1회 · 메인안주 1개 주문 시
          </p>
          <figure className={s.poster}>
            <Image src="/images/event/poster.jpg" alt={`${BRAND.name} 포스터 — ${BRAND.unionName}, ${BRAND.course}`} width={1080} height={1350} sizes="190px" className={s.posterImg} />
            <figcaption className={s.posterCap}>가게 앞 포스터</figcaption>
          </figure>
        </div>
        <p className={`on-photo ${s.scrollHint}`} aria-hidden="true">1차부터 3차까지</p>
      </div>
    </section>
  );
}
