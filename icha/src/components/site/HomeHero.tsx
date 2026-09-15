"use client";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./HomeHero.module.css";

export type HeroSlide = { id: string; num: string; name: string; drink: string; src: string; alt: string };

/**
 * 첫 화면 — 세 매장 밤 외관 실사진이 6초마다 크로스페이드. 첫 장은 서버에서 그대로 렌더되어 바로 보인다.
 * 글자(children)는 서버 컴포넌트가 넣어 준다. 하단의 매장 이름은 인디케이터이자 버튼.
 */
export function HomeHero({ slides, interval = 6000, children }: { slides: HeroSlide[]; interval?: number; children: ReactNode }) {
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0); // 같은 장으로 되돌아와도 진행 막대를 다시 그리기 위한 카운터

  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
      setTick((n) => n + 1);
    }, interval);
    return () => window.clearInterval(t);
  }, [slides.length, interval, tick]);

  const go = (i: number) => {
    setIdx(i);
    setTick((n) => n + 1);
  };

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.slides} aria-hidden="true">
        {slides.map((s, i) => (
          <div key={s.id} className={`${styles.slide} ${i === idx ? styles.active : ""}`}>
            <Image src={s.src} alt="" fill sizes="100vw" priority={i === 0} className={styles.img} />
          </div>
        ))}
      </div>
      <div className={styles.shade} aria-hidden="true" />

      <div className={`wrap ${styles.content}`}>{children}</div>

      <div className={`wrap ${styles.bottom}`}>
        <ol className={styles.dots} aria-label="지금 보이는 매장">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
                onClick={() => go(i)}
                aria-current={i === idx ? "true" : undefined}
                aria-label={`${s.name} 사진 보기`}
              >
                <span className={styles.dotNum}>{s.num}</span>
                <span className={styles.dotName}>{s.name}</span>
                <span className={styles.dotDrink}>{s.drink}</span>
                <span className={styles.bar} key={`${s.id}-${tick}`} style={{ animationDuration: `${interval}ms` }} />
              </button>
            </li>
          ))}
        </ol>
        <p className={styles.caption} aria-live="polite">
          {slides[idx]?.alt}
        </p>
      </div>
    </section>
  );
}
