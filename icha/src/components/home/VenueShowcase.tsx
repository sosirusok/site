"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import type { StoreId } from "@/lib/config";
import s from "./vip-lower.module.css";

type Venue = {
  id: StoreId;
  name: string;
  shortName: string;
  drink: string;
  course: number;
  photo: string;
  alt: string;
  today: { open: boolean; state: string; hours: string };
  notice: string;
  benefit: string;
  booking: string | null;
};

const TITLE_ART: Record<StoreId, { src: string; height: number }> = {
  tokyo: { src: "/images/privilege/tokyo-title.webp", height: 150 },
  joseon: { src: "/images/privilege/joseon-title.webp", height: 160 },
  wareureu: { src: "/images/privilege/wareureu-title.webp", height: 149 },
};

export function VenueShowcase({ venues }: { venues: Venue[] }) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % venues.length;
    else if (event.key === "ArrowLeft") next = (index + venues.length - 1) % venues.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = venues.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className={s.venueShowcase}>
      <div className={s.venueTabs} role="tablist" aria-label="매장 선택">
        {venues.map((venue, index) => (
          <button
            key={venue.id}
            ref={(element) => { tabs.current[index] = element; }}
            id={`venue-tab-${venue.id}`}
            type="button"
            role="tab"
            aria-selected={selected === index}
            aria-controls={`venue-panel-${venue.id}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => selectWithKeyboard(event, index)}
          >
            <Image src={TITLE_ART[venue.id].src} alt={venue.shortName} width={720} height={TITLE_ART[venue.id].height} sizes="(min-width: 760px) 160px, 100px" className={s.tabLettering} />
            <span className={s.tabArrow} aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      {venues.map((venue, index) => (
        <div
          key={venue.id}
          id={`venue-panel-${venue.id}`}
          role="tabpanel"
          aria-labelledby={`venue-tab-${venue.id}`}
          hidden={selected !== index}
          tabIndex={0}
          className={s.venuePanel}
          data-store={venue.id}
        >
          <Link href={`/stores/${venue.id}`} className={s.venuePhoto} aria-label={`${venue.name} 매장 보기`}>
            <Image src={venue.photo} alt={venue.alt} fill sizes="(min-width: 1200px) 680px, (min-width: 760px) 55vw, calc(100vw - 48px)" className={s.venueImage} />
          </Link>
          <div className={s.venueInformation}>
            <div className={s.venueHeading}>
              <p className={s.venueCategory}>{venue.drink}<span aria-hidden="true"> / </span>{venue.id === "joseon" ? "서면밀레오레본점" : "서면점"}</p>
              <h3><Link href={`/stores/${venue.id}`} aria-label={`${venue.name} 매장 정보`}>
                <Image src={TITLE_ART[venue.id].src} alt={venue.shortName} width={720} height={TITLE_ART[venue.id].height} sizes="(min-width: 960px) 255px, 220px" className={s.venueLettering} />
              </Link></h3>
              <p className={s.venueHours}><span className={s.openState} data-open={venue.today.open}>{venue.today.state}</span>{venue.today.hours ? <span>{venue.today.hours}</span> : null}</p>
            </div>
            <dl className={s.venueFacts}>
              <div><dt>쿠폰 혜택</dt><dd>{venue.benefit} 무료</dd></div>
              {venue.notice ? <div><dt>매장 공지</dt><dd>{venue.notice}</dd></div> : null}
            </dl>
            <nav className={s.venueActions} aria-label={`${venue.shortName} 바로가기`}>
              <Link href={`/stores/${venue.id}`}>매장 둘러보기 <span aria-hidden="true">↗</span></Link>
              {venue.booking ? <a href={venue.booking} target="_blank" rel="noreferrer">네이버 예약 <span aria-hidden="true">↗</span></a> : null}
            </nav>
          </div>
        </div>
      ))}
    </div>
  );
}
