import Image from "next/image";
import Link from "next/link";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import type { Rules, StoreId } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./lower-home.module.css";

const STORY: Record<StoreId, { photo: string; alt: string }> = {
  tokyo: {
    photo: "/images/diamond/venue-tokyo-v2.webp",
    alt: "도쿄스탠드",
  },
  joseon: {
    photo: "/images/diamond/venue-joseon-v2.webp",
    alt: "조선칼국수와 통막걸리",
  },
  wareureu: {
    photo: "/images/diamond/venue-wareureu-v2.webp",
    alt: "와르르맨숀",
  },
};

/** 오늘 영업 — 상태 문구와 시간("17:00~03:00", 휴무면 "") */
export function todayParts(store: Store, now: Date): { open: boolean; state: string; hours: string } {
  const st = openStatus(store, now);
  if (st.today === "휴무") return { open: false, state: "휴무", hours: "" };
  return { open: st.open, state: nowText(st), hours: st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "익일 ") };
}

/** 혜택 품목 이름 — DB 혜택 이름들("또는"으로 잇는다), 없으면 기본 혜택 이름 */
export function giftWhat(names: string[], fallback: string): string {
  return (names.length ? names : [fallback]).map((t) => t.trim()).join(" 또는 ");
}

/** 매장명은 아트워크로, 변동되는 영업시간과 혜택은 읽을 수 있는 텍스트로 제공한다. */
export function StoreCards({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section id="stores" className={s.storeStories} aria-labelledby="stores-title">
      <div className={s.sectionHeading}>
        <h2 id="stores-title">참여 매장</h2>
        <p>세 매장 모두 50m 이내</p>
      </div>
      <div className={s.storeGrid}>
        {ordered.map((store) => {
          const story = STORY[store.id];
          const links = placeLinks(store);
          const today = todayParts(store, now);
          const notice = rules.storeNotices?.[store.id]?.trim();
          const what = giftWhat(gifts[store.id] ?? [], store.benefitLabel);
          return (
            <article key={store.id} className={s.storeStory} data-store={store.id} aria-labelledby={`${store.id}-title`}>
              <h3 id={`${store.id}-title`} className="sr-only">{store.name}</h3>
              <div className={s.storeTopline} aria-hidden="true">
                <span>{String(store.course.n).padStart(2, "0")}</span>
                <span>{store.drink}</span>
              </div>
              <Link href={`/stores/${store.id}`} className={s.storyPhoto} aria-label={`${store.name} 매장 보기`}>
                <Image
                  src={story.photo}
                  alt={story.alt}
                  fill
                  sizes="(min-width: 1440px) 420px, (min-width: 960px) 30vw, (min-width: 380px) 315px, calc(100vw - 40px)"
                  className={s.storyPhotoImage}
                />
              </Link>
              <div className={s.storyInfo}>
                <p className={s.storyFullName}>{store.name}</p>
                <dl className={s.storyFacts}>
                  <div>
                    <dt>오늘</dt>
                    <dd><span className={s.openState} data-open={today.open}>{today.state}</span>{today.hours ? ` · ${today.hours}` : ""}</dd>
                  </div>
                  <div>
                    <dt>혜택</dt>
                    <dd>{what} 무료</dd>
                  </div>
                  {notice ? <div><dt>공지</dt><dd>{notice}</dd></div> : null}
                </dl>
                <nav className={s.storyLinks} aria-label={`${store.shortName} 바로가기`}>
                  <Link href={`/stores/${store.id}`}>메뉴 · 매장 정보 <span aria-hidden="true">↗</span></Link>
                  {links ? <a href={links.booking} target="_blank" rel="noreferrer">네이버 예약 <span aria-hidden="true">↗</span></a> : null}
                </nav>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
