"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { StoreId } from "@/lib/config";
import s from "./vip-lower.module.css";

type Photo = { src: string; alt: string; label: string };
type Venue = {
  id: StoreId; name: string; shortName: string; drink: string; course: number;
  photo: string; alt: string; gallery: Photo[];
  today: { open: boolean; state: string; hours: string };
  notice: string; benefit: string; booking: string | null;
};
const TITLE_ART: Record<StoreId, { src: string; height: number }> = {
  tokyo: { src: "/images/privilege/tokyo-title.webp", height: 150 },
  joseon: { src: "/images/privilege/joseon-title.webp", height: 160 },
  wareureu: { src: "/images/privilege/wareureu-title.webp", height: 149 },
};

export function VenueShowcase({ venues }: { venues: Venue[] }) {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const count = venues.length;
  const canPlay = playing && !reducedMotion && inView && pageVisible && count > 1;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setReducedMotion(media.matches); if (media.matches) setPlaying(false); };
    const visibility = () => setPageVisible(!document.hidden);
    sync(); visibility();
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView((entry?.intersectionRatio ?? 0) >= .2), { threshold: .2 });
    if (stage.current) observer.observe(stage.current);
    return () => { observer.disconnect(); media.removeEventListener("change", sync); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    if (!canPlay) return;
    const timer = window.setInterval(() => setSelected(index => (index + 1) % count), 8000);
    return () => window.clearInterval(timer);
  }, [canPlay, count]);

  function select(index: number) {
    setPlaying(false);
    setSelected((index + count) % count);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLAnchorElement) return;
    if (event.key === "ArrowRight") { event.preventDefault(); select(selected + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); select(selected - 1); }
    if (event.key === "Home") { event.preventDefault(); select(0); }
    if (event.key === "End") { event.preventDefault(); select(count - 1); }
  }
  function pointerStart(event: PointerEvent<HTMLDivElement>) {
    swiped.current = false;
    gesture.current = null;
    if (event.target instanceof Element && event.target.closest("[data-carousel-controls]")) return;
    if (!event.isPrimary || event.pointerType === "mouse") return;
    setPlaying(false);
    gesture.current = { x: event.clientX, y: event.clientY };
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      swiped.current = true;
      select(selected + (dx < 0 ? 1 : -1));
    }
  }

  return (
    <div className={s.venueShowcase} role="region" aria-roledescription="캐러셀" aria-label="세 매장 사진과 혜택"
      onKeyDown={keyboard} onFocusCapture={event => {
        if (!(event.target instanceof Element && event.target.closest("[data-play-control]"))) setPlaying(false);
      }}>
      <div className={s.carouselHeading}>
        <div className={s.nameWindow} aria-hidden="true">
          {venues.map((venue, index) => (
            <Image key={venue.id} src={TITLE_ART[venue.id].src} alt="" width={720} height={TITLE_ART[venue.id].height}
              sizes="(min-width: 760px) 340px, 260px" className={s.animatedName} data-active={index === selected} />
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live={playing ? "off" : "polite"} aria-atomic="true">{selected + 1} / {count} · {venues[selected]?.name}</p>

      <div ref={stage} className={s.venueStage} data-playing={canPlay}
        onPointerDown={pointerStart} onPointerUp={pointerEnd} onPointerCancel={() => { gesture.current = null; }}
        onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}>
        <div className={s.controlLayer}>
          <div className={s.photoControls} data-carousel-controls role="group" aria-label="매장 사진 전환">
            <button type="button" aria-label="이전 매장" onClick={() => select(selected - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6" /></svg>
            </button>
            <button type="button" aria-label="다음 매장" onClick={() => select(selected + 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m10 6 6 6-6 6" /></svg>
            </button>
            {!reducedMotion && <button type="button" data-play-control aria-label={playing ? "슬라이드 일시정지" : "슬라이드 재생"}
              aria-pressed={playing} onClick={() => setPlaying(value => !value)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {playing ? <path d="M9 6v12M15 6v12" /> : <path d="m9 5 10 7-10 7Z" />}
              </svg>
            </button>}
          </div>
        </div>
        {venues.map((venue, index) => (
          <article key={venue.id} id={`venue-panel-${venue.id}`} className={s.venuePanel} data-active={selected === index}
            data-store={venue.id} aria-hidden={selected !== index} inert={selected !== index}
            role="group" aria-roledescription="슬라이드" aria-label={`${index + 1} / ${count} · ${venue.name}`}>
            <div className={s.photos}>
              <Link href={`/stores/${venue.id}`} className={s.venuePhoto} aria-label={`${venue.name} 사진과 메뉴 보기`} draggable={false}>
                <Image src={venue.photo} alt={venue.alt} fill sizes="(min-width: 1200px) 680px, (min-width: 760px) 55vw, calc(100vw - 32px)"
                  loading={index === 0 ? "eager" : "lazy"} className={s.venueImage} draggable={false} />
              </Link>
              <div className={s.photoGallery}>
                {venue.gallery.map(photo => (
                  <Link href={`/stores/${venue.id}`} key={photo.src} className={s.galleryItem} draggable={false}>
                    <span className={s.galleryFrame}><Image src={photo.src} alt={photo.alt} fill
                      sizes="(min-width: 1200px) 330px, (min-width: 760px) 27vw, calc((100vw - 44px) / 2)" draggable={false} /></span>
                    <span>{photo.label} <span aria-hidden="true">↗</span></span>
                  </Link>
                ))}
              </div>
            </div>
            <div className={s.venueInformation}>
              <h3 className="sr-only">{venue.name}</h3>
              <p className={s.venueCategory}>{venue.drink} · {venue.id === "joseon" ? "서면밀레오레본점" : "서면점"}</p>
              <p className={s.venueHours}><span className={s.openState} data-open={venue.today.open}>{venue.today.state}</span><span>{venue.today.hours}</span></p>
              <div className={s.venueBenefit}><p>다음 방문 쿠폰 혜택</p><strong>{venue.benefit} 무료</strong></div>
              {venue.notice ? <p className={s.venueNotice}>{venue.notice}</p> : null}
              <nav className={s.venueActions} aria-label={`${venue.shortName} 바로가기`}>
                <Link href={`/stores/${venue.id}`} className={s.mainAction}>사진·메뉴 보기 <span aria-hidden="true">↗</span></Link>
                {venue.booking ? <a href={venue.booking} target="_blank" rel="noreferrer" className={s.secondaryAction}>네이버 예약 <span aria-hidden="true">↗</span></a> : null}
              </nav>
            </div>
          </article>
        ))}
      </div>
      <div className={s.venueChoices} aria-label="매장 바로 선택">
        {venues.map((venue, index) => (
          <button key={venue.id} type="button" aria-label={`${venue.shortName} 선택`} aria-pressed={index === selected}
            aria-controls={`venue-panel-${venue.id}`} onClick={() => select(index)}>
            <span>{venue.shortName}</span><span className={s.choiceLine} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
