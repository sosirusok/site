import { Piece } from "@/components/site/Poster";
import { BRAND } from "@/lib/config";
import s from "./PosterHero.module.css";

/** 첫 장면 — 키트 머리 배너(head-banner 1080x420)를 화면 폭 그대로: 자르지 않고, 덮지 않고, 그림자도 얹지 않는다. */
export function PosterHero() {
  return (
    <section className={s.hero} aria-labelledby="event-title">
      <h1 id="event-title" className="sr-only">{BRAND.name} — {BRAND.tagline}</h1>
      <Piece name="hero-top" priority className={s.img} bare sizes="(min-width: 480px) 480px, 100vw" />
    </section>
  );
}
