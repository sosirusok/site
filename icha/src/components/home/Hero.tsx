import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { BRAND, type Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/**
 * 첫 화면 — 사장님 포스터의 윗부분(제목·부제·세 간판까지, 1080x900)을 화면 폭 가득. 그림의 아래 끝은 사이트 바탕색(#0b0810)으로 녹아들게 구워 두어(scripts 없이 sharp 로 한 번 만든 poster-hero.jpg)
 * 포스터가 화면으로 그대로 이어진다. 그 아래 제목·설명·버튼 둘·사실 세 줄은 HTML — 실제 이벤트 사이트가 KV 를 쓰는 방식.
 */
export function Hero({ rules }: { rules: Rules }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.kv}>
        <Image src="/images/event/poster-hero.jpg" alt={`${BRAND.name} 포스터 — 소주·맥주·막걸리, ${BRAND.unionName}, ${BRAND.course}. 1차 도쿄스탠드 서면, 2차 조선칼국수와 통막걸리 밀리오레점, 3차 와르르맨숀 서면`} width={1080} height={900} priority fetchPriority="high" sizes="(min-width: 480px) 480px, 100vw" className={s.kvImg} />
      </div>
      <div className={s.intro}>
        <span className="eyebrow">Seomyeon · 3 bars · 50m</span>
        <h1 id="hero-title" className="h1">소주·맥주·막걸리,<br />{BRAND.unionName}</h1>
        <p className="lead">한 매장에서 계산할 때 휴대폰 번호를 말씀하시면 쿠폰이 발급됩니다. 50m 안의 다른 매장에서 메인안주 1개를 주문하고 쿠폰을 보여 주시면 매장별 특별 혜택을 드립니다.</p>
        <div className={`btn-row ${s.ctas}`}>
          <Button href="#stores" variant="naver" size="lg">매장 예약하기</Button>
          <Button href="/wallet" variant="outline" size="lg">내 쿠폰함</Button>
        </div>
        <dl className={s.facts}>
          <div className={s.fact}><dt>참여 매장</dt><dd>{ordered.map((st) => `${st.course.n}차 ${st.shortName}`).join(" · ")}</dd></div>
          <div className={s.fact}><dt>이용 조건</dt><dd>{BRAND.condition}</dd></div>
          <div className={s.fact}><dt>쿠폰</dt><dd>{ruleLine(rules)} · 계산 시 휴대폰 번호로 발급</dd></div>
        </dl>
      </div>
    </section>
  );
}
