import Image from "next/image";
import Link from "next/link";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

/** 사진 한 장과 검정 여백으로 시작한다. 장식 대신 실제 바의 질감과 밤 조명으로 분위기를 만든다. */
export function Hero({ rules }: { rules: Rules }) {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroCopy}>
        <h1 id="hero-title" className="sr-only">알콜부시기 — 서면 세 가게 콜라보</h1>
        <Image
          src="/images/afterdark/wordmark-main.png"
          alt="알콜부시기"
          width={1800}
          height={390}
          sizes="(min-width: 760px) 42vw, 82vw"
          priority
          className={s.heroWordmark}
        />
        <div className={s.heroMeta}>
          <p>서면역 6번 출구 · 50m 안 세 곳</p>
          <p>{ruleLine(rules)}</p>
        </div>
        <nav className={s.heroLinks} aria-label="첫 화면 바로가기">
          <a href="#stores">세 곳 보기</a>
          <Link href="/wallet">쿠폰 열기</Link>
        </nav>
      </div>
      <div className={s.heroImage}>
        <Image
          src="/images/afterdark/hero-tap-night.webp"
          alt="도쿄스탠드에서 생맥주를 따르는 순간"
          fill
          priority
          sizes="(min-width: 760px) 60vw, 100vw"
          style={{ objectPosition: "49% 48%" }}
        />
      </div>
    </section>
  );
}

