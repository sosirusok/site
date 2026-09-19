import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { calloutLines } from "@/components/home/StoreBlocks";
import { KitPiece, SectionLabel, StickerButton } from "@/components/site/Kit";
import { NextStop } from "@/components/site/NextStop";
import { benefitOf, Piece } from "@/components/site/Poster";
import { StoreGallery } from "@/components/site/StoreGallery";
import { StoreHero } from "@/components/site/StoreHero";
import { MenuThumb, StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreVisit } from "@/components/site/StoreVisit";
import { BRAND, formatWon, STORE_IDS, type StoreId } from "@/lib/config";
import { listMenu, type MenuItem } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { getStore } from "@/lib/stores";
import styles from "./page.module.css";

/** 정적(ISR) — 세 매장을 빌드 때 만들어 두고 60초마다 뒤에서 새로 만든다. 관리자가 메뉴·공지를 저장하면 revalidatePath("/stores/[id]") 로 바로. 없는 id 는 notFound(그 결과도 60초 캐시). */
export const revalidate = 60;

export function generateStaticParams(): { id: StoreId }[] {
  return STORE_IDS.map((id) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };

/** 혜택 상자의 오른쪽 끝을 뚫고 나오는 키트 컷아웃 — 1차 맥주잔(110px 높이), 2차 막걸리 주전자(104px 폭), 3차 요거트 아이스크림(96px 높이; 소주병은 혜택 품목 줄에) */
const CUT: Record<StoreId, { name: string; cls: "cutTall" | "cutWide" | "cutYogurt" }> = {
  tokyo: { name: "cut-beer", cls: "cutTall" },
  joseon: { name: "cut-makgeolli", cls: "cutWide" },
  wareureu: { name: "cut-yogurt", cls: "cutYogurt" },
};

/** 혜택 품목에 사진이 없을 때 품목 띠 왼쪽 끝에 놓는 그 집 술 컷아웃 — 와르르맨숀의 소주 1병은 cut-soju(디자이너 배정) */
const DRINK_CUT: Record<StoreId, string> = { tokyo: "cut-beer", joseon: "cut-makgeolli", wareureu: "cut-soju" };

function hasPhoto(m: MenuItem): boolean {
  return Boolean(m.imagePath || m.hasImageData);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "페이지를 찾을 수 없습니다" };
  return {
    title: store.name,
    description: `${BRAND.name} ${store.course.n}차 ${store.name} · ${store.address} · 다른 매장 쿠폰 제시 시 ${store.benefitLabel} 무료`,
  };
}

/**
 * 매장 화면 — 포스터 한 장처럼: 대표 안주 사진 위에 간판(사진 아래를 덮는다) + 컷아웃, 검은 띠(상태·시간·별점·주소·전화 꼬리표),
 * 특별 혜택(제목판이 혜택 상자의 왼쪽 위 모서리를 덮고, 상자 오른쪽 위에 무료 도장, 오른쪽 끝을 컷아웃이 뚫는다, 아래 노란 콜아웃, 품목마다 검은 띠: 사진 컷아웃 | 이름 · 원래 값 | 무료 도장),
 * 사진(폴라로이드 다섯이 서로 겹친 벽), 메뉴(테이프 붙인 종이 메뉴판), 오시는 길(테이프 지도 + 메모 한 장), 리뷰(겹친 종이 조각), 다음 매장(검은 띠).
 * 초록 버튼은 아래 고정 크림 바의 [예약하기](64px) 하나. 섹션 사이 빈 보케는 제목판이 다음 조각을 덮으며 잇는다.
 */
export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const store = getStore(id);
  if (!store) notFound();

  const [menu, gifts, rules] = await Promise.all([
    listMenu(store.id).catch(() => []),
    listMenu(store.id, { giftOnly: true }).catch(() => []),
    getRules(),
  ]);
  const links = placeLinks(store);
  const notice = rules.storeNotices[store.id]?.trim() ?? "";
  const reviewBenefit = rules.reviewBenefit[store.id]?.trim() ?? "";
  const cut = CUT[store.id];
  const [line1, line2] = calloutLines(gifts.map((g) => g.name), store.benefitLabel);

  return (
    <article className={styles.page} data-store={store.id}>
      <StoreHero store={store} />

      {notice && <p className={`band ${styles.notice}`}><b className={styles.noticeDay}>공지</b>{notice}</p>}

      <section className={styles.sec} aria-labelledby="gift-title">
        <div className={styles.giftScene}>
          <SectionLabel kind="benefit" color="red" id="gift-title" className={styles.giftLabel}>특별 혜택</SectionLabel>
          <Piece name={benefitOf(store.id)} rotate={1.5} sizes="330px" className={styles.benefit} />
          <KitPiece name="stamp-free" bare sizes="64px" className={styles.giftStamp} />
          <KitPiece name={cut.name} bare sizes="120px" className={`${styles.cut} ${styles[cut.cls]}`} />
          <p className={`callout ${styles.giftCallout}`}>
            {line1}<br />{line2}
            {gifts.length > 1 && <span className={`tag tag-yellow ${styles.giftPick}`}>택 1</span>}
          </p>
          <ul className={styles.giftList}>
            {gifts.map((g, i) => (
              <li key={g.id} className={`band ${styles.gift}`} style={{ "--r": `${i % 2 ? 1 : -1}deg` } as CSSProperties}>
                <span className={styles.giftThumb}>
                  {hasPhoto(g) ? <MenuThumb m={g} size={64} /> : <KitPiece name={DRINK_CUT[store.id]} bare sizes="64px" className={styles.giftCut} />}
                </span>
                <span className={styles.giftBody}>
                  <span className={styles.giftName}>{g.name}</span>
                  {g.description && <span className={styles.giftDesc}>{g.description}</span>}
                  {g.price != null && <s className={`num ${styles.giftStrike}`}>{formatWon(g.price)}</s>}
                </span>
                <KitPiece name="stamp-free" bare sizes="52px" className={styles.giftFree} fallback={<span className={`stamp ${styles.giftFreeText}`}>무료</span>} />
              </li>
            ))}
          </ul>
          <p className={`band ${styles.giftRule}`}><span className="c">이용 조건</span> · {BRAND.condition}</p>
        </div>
      </section>

      <section className={styles.sec} aria-labelledby="photo-title">
        <SectionLabel kind="photo" color="blue" id="photo-title" className={styles.overLabel}>사진</SectionLabel>
        <StoreGallery store={store} photoUrl={links?.photo ?? null} />
      </section>

      <section className={`${styles.sec} ${styles.anchor}`} id="menu" aria-labelledby="menu-title">
        <SectionLabel kind="menu" color="yellow" id="menu-title" className={styles.overLabel}>메뉴</SectionLabel>
        <StoreMenu store={store} items={menu} menuUrl={links?.menu ?? null} />
      </section>

      <section className={`${styles.sec} ${styles.anchor}`} id="visit" aria-labelledby="visit-title">
        <div className={styles.headRow}>
          <SectionLabel kind="map" color="blue" id="visit-title" className={styles.overLabel}>오시는 길</SectionLabel>
          <p className={`callout ${styles.lead}`}>3개 매장 50m 이내</p>
        </div>
        <StoreVisit store={store} />
      </section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <section className={styles.sec} aria-labelledby="reviews-title">
          <SectionLabel kind="review" color="green" id="reviews-title" className={styles.reviewLabel}>리뷰</SectionLabel>
          <StoreReviews store={store} limit={2} reviewUrl={links?.review ?? null} benefit={reviewBenefit || null} />
        </section>
      )}

      <NextStop store={store} className={styles.next} />

      {links && (
        <div className="fixed-col sticky-bar">
          <StickerButton kind="book" block href={links.booking} suffix={` — ${store.shortName}`}>예약하기</StickerButton>
        </div>
      )}
    </article>
  );
}
