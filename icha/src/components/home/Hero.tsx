import Image from "next/image";
import Link from "next/link";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./hero.module.css";

export function Hero({ rules }: { rules: Rules }) {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">알콜부시기 — 서면 세 가게 콜라보</h1>
      <div className={s.artwork} aria-hidden="true">
        <Image src="/images/diamond/hero.webp" alt="" width={1440} height={1440}
          sizes="(min-width: 960px) 980px, (min-width: 600px) 700px, 100vw"
          loading="eager" fetchPriority="high" className={s.keyVisual} />
      </div>
      <div className={s.topline}>
        <span>SEOMYEON, BUSAN</span>
        <span>서면 세 매장 콜라보</span>
      </div>
      <nav className={s.venues} aria-label="참여 매장">
        <Link href="/stores/tokyo">도쿄스탠드</Link>
        <Link href="/stores/joseon">조선칼국수</Link>
        <Link href="/stores/wareureu">와르르맨숀</Link>
      </nav>
      <div className={s.bottom}>
        <div className={s.intro}>
          <p className={s.location}>다음 매장에서, 무료 혜택.</p>
          <p className={s.condition}>{ruleLine(rules)}</p>
        </div>
        <nav className={s.actions} aria-label="첫 화면 바로가기">
          <a href="#stores" className={s.enter} aria-label="참여 매장 보기">
            <Image src="/images/diamond/enter-v2.webp" alt="매장 보기" width={750} height={250} sizes="210px" />
          </a>
          <Link href="/wallet" className={s.wallet}>내 쿠폰함 <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
      <a className={s.scroll} href="#stores" aria-label="참여 매장으로 스크롤"><span>EXPLORE THE PLACES</span><span aria-hidden="true">↓</span></a>
    </section>
  );
}
