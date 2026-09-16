"use client";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./HomeHero.module.css";

export type HeroSlide = { id: string; src: string; alt: string; label: string };

/**
 * 첫 화면 — 세 매장 외관·내부 실사진이 6초마다 페이드로 바뀐다. 글자(children)는 서버 컴포넌트가 넣는다.
 * 첫 장은 서버에서 그대로 렌더되어 스크립트 전에도 보인다.
 */
export function HomeHero({ slides, interval = 6000, children }: { slides: HeroSlide[]; interval?: number; children: ReactNode }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), interval);
    return () => window.clearInterval(t);
    // idx 를 의존성에 두어 손으로 고른 뒤에는 그 시점부터 다시 6초를 센다.
  }, [slides.length, interval, idx]);

  return (
    <section className={`${styles.hero} dim`} aria-labelledby="hero-title">
      <div className={styles.slides} aria-hidden="true">
        {slides.map((s, i) => (
          <div key={s.id} className={`${styles.slide} ${i === idx ? styles.active : ""}`}>
            <Image src={s.src} alt="" fill sizes="100vw" priority={i === 0} className={styles.img} />
          </div>
        ))}
      </div>

      <div className={`wrap ${styles.content}`}>{children}</div>

      {slides.length > 1 && (
        <div className={`wrap ${styles.bottom}`}>
          <ol className={styles.dots} aria-label="사진 고르기">
            {slides.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`${styles.dot} ${i === idx ? styles.dotActive : ""}`}
                  onClick={() => setIdx(i)}
                  aria-current={i === idx ? "true" : undefined}
                  aria-label={`${i + 1}번째 사진`}
                />
              </li>
            ))}
          </ol>
          <p className={styles.slideLabel}>{slides[idx]?.label}</p>
        </div>
      )}
    </section>
  );
}
