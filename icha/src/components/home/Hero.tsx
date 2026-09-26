import Image, { getImageProps } from "next/image";
import Link from "next/link";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./hero.module.css";

export function Hero({ rules }: { rules: Rules }) {
  const common = { alt: "", sizes: "(min-width: 1600px) 1600px, 100vw", loading: "eager" as const, fetchPriority: "high" as const };
  const { props: mobile } = getImageProps({ ...common, src: "/images/privilege/hero-mobile.webp", width: 1122, height: 1402 });
  const { props: desktop } = getImageProps({ ...common, src: "/images/privilege/hero-wide.webp", width: 1774, height: 887 });

  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">알콜부시기 — 서면 세 가게 콜라보</h1>
      <p className={s.edition}>SEOMYEON <span aria-hidden="true">/</span> AFTER HOURS</p>
      <picture className={s.artwork} aria-hidden="true">
        <source media="(min-width: 760px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
        {/* getImageProps supplies Next's responsive optimized sources to the art-directed picture. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...mobile} alt="" className={s.keyVisual} />
      </picture>
      <div className={s.invitation}>
        <div className={s.intro}>
          <p className={s.location}>서면의 세 매장, 하나로 이어지는 혜택.</p>
          <p className={s.condition}>{ruleLine(rules)}</p>
        </div>
        <nav className={s.actions} aria-label="첫 화면 바로가기">
          <a href="#stores" className={s.enter} aria-label="매장 둘러보기">
            <Image src="/images/privilege/explore.webp" alt="" width={940} height={209} sizes="240px" />
          </a>
          <Link href="/guide" className={s.guide}>이용 안내 <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
      <div className={s.footnote}>
        <span>도쿄스탠드 · 조선칼국수 · 와르르맨숀</span>
        <a href="#stores" aria-label="매장 선택으로 이동">03 PLACES <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
