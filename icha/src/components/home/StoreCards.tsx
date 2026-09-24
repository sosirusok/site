import Image from "next/image";
import Link from "next/link";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import type { Rules, StoreId } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./home.module.css";

const STORY: Record<StoreId, { photo: string; pos: string; alt: string }> = {
  tokyo: {
    photo: "/images/premium/tokyo-night.webp",
    pos: "50% 50%",
    alt: "도쿄스탠드의 생맥주 두 잔과 햄 플레이트",
  },
  joseon: {
    photo: "/images/premium/joseon-night.webp",
    pos: "50% 50%",
    alt: "조선칼국수와 통막걸리의 차가운 막걸리 주전자",
  },
  wareureu: {
    photo: "/images/stores/wareureu/exterior-dusk.jpg",
    pos: "52% 42%",
    alt: "블루아워의 와르르맨숀 서면점 외관과 간판",
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

/** 사진이 곧 매장 링크다. 카드·배지·이미지 버튼은 두지 않는다. */
export function StoreCards({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section id="stores" className={s.storeStories} aria-labelledby="stores-title">
      <h2 id="stores-title" className="sr-only">참여 매장 세 곳</h2>
      {ordered.map((store) => {
        const story = STORY[store.id];
        const links = placeLinks(store);
        const today = todayParts(store, now);
        const notice = rules.storeNotices?.[store.id]?.trim();
        const what = giftWhat(gifts[store.id] ?? [], store.benefitLabel);
        return (
          <article key={store.id} className={s.storeStory} data-store={store.id}>
            <Link href={`/stores/${store.id}`} className={s.storyPhoto} aria-label={`${store.name} 매장 보기`}>
              <Image
                src={story.photo}
                alt={story.alt}
                fill
                sizes="(min-width: 960px) 66vw, 100vw"
                className={s.storyPhotoImage}
                style={{ objectPosition: story.pos }}
              />
            </Link>
            <div className={s.storyInfo}>
              <p className={s.storyIndex}>{String(store.course.n).padStart(2, "0")}</p>
              <h3 className={s.storyName}>{store.shortName}</h3>
              <p className={s.storyFullName}>{store.name}</p>
              <dl className={s.storyFacts}>
                <div>
                  <dt>오늘</dt>
                  <dd>{today.state}{today.hours ? ` · ${today.hours}` : ""}</dd>
                </div>
                <div>
                  <dt>혜택</dt>
                  <dd>{what} 무료</dd>
                </div>
                {notice ? <div><dt>공지</dt><dd>{notice}</dd></div> : null}
              </dl>
              <nav className={s.storyLinks} aria-label={`${store.shortName} 바로가기`}>
                <Link href={`/stores/${store.id}`}>상세 보기</Link>
                {links ? <a href={links.booking} target="_blank" rel="noreferrer">네이버 예약</a> : null}
              </nav>
            </div>
          </article>
        );
      })}
    </section>
  );
}
