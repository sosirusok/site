import Image from "next/image";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import type { Rules, StoreId } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import { VenueShowcase } from "./VenueShowcase";
import s from "./vip-lower.module.css";

const STORY: Record<StoreId, { photo: string; alt: string; gallery: Array<{ src: string; alt: string; label: string }> }> = {
  tokyo: {
    photo: "/images/stores/tokyo/cold-ham-plate-beers.jpg",
    alt: "도쿄스탠드의 생맥주 두 잔과 콜드햄 플레이트",
    gallery: [
      { src: "/images/stores/tokyo/draft-foam.jpg", alt: "도쿄스탠드 생맥주를 따르는 모습", label: "생맥주" },
      { src: "/images/stores/tokyo/interior-noren.jpg", alt: "도쿄스탠드 매장 내부", label: "매장 분위기" },
    ],
  },
  joseon: {
    photo: "/images/stores/joseon/makgeolli-cheers.jpg",
    alt: "조선칼국수에서 막걸리 잔을 맞대는 모습",
    gallery: [
      { src: "/images/stores/joseon/modeum-jeon.jpg", alt: "조선칼국수의 모둠전", label: "모둠전" },
      { src: "/images/stores/joseon/interior-window.jpg", alt: "조선칼국수 창가 좌석", label: "매장 분위기" },
    ],
  },
  wareureu: {
    photo: "/images/stores/wareureu/interior-hall.jpg",
    alt: "와르르맨숀의 로고 벽과 좌석",
    gallery: [
      { src: "/images/stores/wareureu/yukhoe-chadol-ssam.jpg", alt: "와르르맨숀의 육회차돌쌈", label: "육회차돌쌈" },
      { src: "/images/stores/wareureu/interior-overview.jpg", alt: "와르르맨숀 홀 전경", label: "매장 분위기" },
    ],
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

/** 서버에서 오늘의 영업·혜택을 정리하고, 선택 동작만 작은 클라이언트 컴포넌트에 맡긴다. */
export function StoreCards({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const venues = ordered.map((store) => ({
    id: store.id,
    name: store.name,
    shortName: store.shortName,
    drink: store.drink,
    course: store.course.n,
    ...STORY[store.id],
    today: todayParts(store, now),
    notice: rules.storeNotices?.[store.id]?.trim() ?? "",
    benefit: giftWhat(gifts[store.id] ?? [], store.benefitLabel),
    booking: placeLinks(store)?.booking ?? null,
  }));
  return (
    <section id="stores" className={s.storeStories} aria-labelledby="stores-title">
      <div className={s.sectionHeading}>
        <div className={s.sectionIdentity}>
          <h2 id="stores-title" className={s.collectionTitle}>
            <Image src="/images/privilege/collection-title.webp" alt="세 곳의 취향" width={720} height={155} sizes="(min-width: 760px) 230px, 190px" className={s.titleArtwork} />
          </h2>
        </div>
        <p>서면, 걸어서 이어지는 세 매장</p>
      </div>
      <VenueShowcase venues={venues} />
    </section>
  );
}
