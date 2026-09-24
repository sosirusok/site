import Image from "next/image";
import Link from "next/link";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

/** 검은 여백과 술의 반사광으로 시작한다. 금색 UI 대신 실제 잔과 금속에서만 금빛이 나온다. */
export function Hero({ rules }: { rules: Rules }) {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroCopy}>
        <h1 id="hero-title" className="sr-only">알콜부시기 — 서면 세 가게 콜라보</h1>
        <div className={s.heroLockup}>
          <p className={s.heroEdition}>SEOMYEON · THREE VENUES</p>
          <Image
            src="/images/afterdark/wordmark-main.png"
            alt="알콜부시기"
            width={1800}
            height={390}
            sizes="(min-width: 760px) 38vw, 82vw"
            priority
            className={s.heroWordmark}
          />
          <p className={s.heroVenueLine}>도쿄스탠드 · 조선칼국수 · 와르르맨숀</p>
        </div>
        <div className={s.heroMeta}>
          <p>서면역 6번 출구 · 세 매장 모두 50m 이내</p>
          <p>{ruleLine(rules)}</p>
        </div>
        <nav className={s.heroLinks} aria-label="첫 화면 바로가기">
          <a href="#stores">매장 보기</a>
          <Link href="/wallet">쿠폰함</Link>
        </nav>
      </div>
      <div className={s.heroImage}>
        <Image
          src="/images/afterdark/hero-tap-night.webp"
          alt="도쿄스탠드에서 생맥주를 따르는 순간"
          fill
          priority
          sizes="(min-width: 760px) 60vw, 100vw"
          style={{ objectPosition: "50% 48%" }}
        />
        <p className={s.heroCaption}>TOKYO STAND · SEOMYEON</p>
      </div>
    </section>
  );
}
