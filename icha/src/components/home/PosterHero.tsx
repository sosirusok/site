import { Piece } from "@/components/site/Poster";
import { BRAND } from "@/lib/config";
import s from "./PosterHero.module.css";

/** 첫 장면 — 포스터 머리 부분(보케·붓글씨 제목·소주 맥주 막걸리·서면 3가게 콜라보·50m 한 줄)을 화면 폭 그대로 붙인다. */
export function PosterHero() {
  return (
    <section className={s.hero} aria-labelledby="event-title">
      <h1 id="event-title" className="sr-only">{BRAND.name} — {BRAND.tagline}</h1>
      <Piece name="hero-top" priority className={s.img} bare />
    </section>
  );
}
