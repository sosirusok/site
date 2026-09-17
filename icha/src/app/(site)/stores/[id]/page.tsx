import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { KitPiece, SectionLabel, StickerButton } from "@/components/site/Kit";
import { NextStop } from "@/components/site/NextStop";
import { benefitOf, Piece } from "@/components/site/Poster";
import { StoreGallery } from "@/components/site/StoreGallery";
import { StoreHero } from "@/components/site/StoreHero";
import { MenuThumb, StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreVisit } from "@/components/site/StoreVisit";
import { BRAND, formatWon, type StoreId } from "@/lib/config";
import { giftLine } from "@/lib/copy";
import { listMenu, type MenuItem } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { getStore } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** 혜택 상자 옆에 붙는 키트 컷아웃 — 1차 맥주잔(96px 높이), 2차 막걸리 주전자(76px 폭), 3차 요거트 아이스크림(84px 높이; 소주병은 혜택 품목 줄의 사진 자리에) */
const CUT: Record<StoreId, { name: string; cls: "cutTall" | "cutWide" | "cutYogurt" }> = {
  tokyo: { name: "cut-beer", cls: "cutTall" },
  joseon: { name: "cut-makgeolli", cls: "cutWide" },
  wareureu: { name: "cut-yogurt", cls: "cutYogurt" },
};

/** 혜택 품목에 사진이 없을 때 사진 자리(64px)에 놓는 그 집 술 컷아웃 — 와르르맨숀의 소주 1병은 cut-soju(디자이너 배정). 사진 있는 줄과 글자 시작점이 같다 */
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
 * 매장 화면 — 밤 사진 위에 키트 간판, 어두운 띠(상태 칩·오늘 영업시간·별점), 종이(영업시간·주소·전화),
 * 특별 혜택(키트 제목판 + 혜택 상자 ≤300 + 컷아웃 + 찢은 종이: 혜택 한 줄(둘이면 노란 꼬리표 '택 1')·품목 줄(사진 64px 또는 술 컷아웃 | 이름·설명·값 + 무료 도장 오른쪽 끝)·조건), 사진(키트 제목판 + 폴라로이드 다섯, 캡션 + [사진 더 보기]),
 * 메뉴(종이 메뉴판 + [메뉴 전체 보기]), 오시는 길(테이프 지도 + [길찾기]), 리뷰(종이 조각 + [네이버 리뷰 남기기]), 다음 매장(종이 한 줄).
 * 정보 글자는 전부 본문 글꼴, 명사구·합니다체. 초록 버튼은 아래 고정 크림 바의 [예약하기](64px) 하나 — 본문은 .app:has(.sticky-bar) 가 그만큼 아래를 비운다.
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

  return (
    <article className={styles.page} data-store={store.id}>
      <StoreHero store={store} />

      {notice && (
        <div className={`paper paper-r ${styles.notice}`}>
          <p className={styles.noticeIn}><b className={styles.noticeDay}>공지</b>{notice}</p>
        </div>
      )}

      <section className={styles.sec} aria-labelledby="gift-title">
        <div className="sec-h">
          <SectionLabel kind="benefit" color="red" id="gift-title">특별 혜택</SectionLabel>
        </div>
        <div className={styles.giftRow}>
          <div className={styles.giftTop}>
            <Piece name={benefitOf(store.id)} rotate={-1} sizes="300px" className={styles.benefit} />
            <KitPiece name={cut.name} bare sizes="100px" className={`${styles.cut} ${styles[cut.cls]}`} />
          </div>
          <div className={`scrap ${styles.giftScrap}`} style={{ "--r": "1deg" } as CSSProperties}>
            <div className={`scrap-in ${styles.giftIn}`}>
              <p className={styles.giftHead}>
                {giftLine(gifts.map((g) => g.name), store.benefitLabel)}
                {gifts.length > 1 && <span className={`tag tag-yellow ${styles.giftPick}`}>택 1</span>}
              </p>
              {gifts.map((g) => (
                <div key={g.id} className={styles.gift}>
                  <div className={styles.giftThumb}>
                    {hasPhoto(g) ? <MenuThumb m={g} size={64} /> : <KitPiece name={DRINK_CUT[store.id]} bare sizes="64px" className={styles.giftCut} />}
                  </div>
                  <div className={styles.giftBody}>
                    <p className={styles.giftName}>{g.name}</p>
                    {g.description && <p className={styles.giftDesc}>{g.description}</p>}
                    <p className={styles.giftPrice}>
                      {g.price != null && <s className={`strike num ${styles.giftStrike}`}>{formatWon(g.price)}</s>}
                      <KitPiece name="stamp-free" bare sizes="56px" className={styles.giftStamp} fallback={<span className={`stamp ${styles.giftFree}`}>무료</span>} />
                    </p>
                  </div>
                </div>
              ))}
              <p className={styles.giftRule}>이용 조건 · {BRAND.condition}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sec} aria-labelledby="photo-title">
        <div className="sec-h">
          <SectionLabel kind="photo" color="blue" id="photo-title">사진</SectionLabel>
        </div>
        <StoreGallery store={store} photoUrl={links?.photo ?? null} />
      </section>

      <section className={`${styles.sec} ${styles.anchor}`} id="menu" aria-labelledby="menu-title">
        <div className="sec-h">
          <SectionLabel kind="menu" color="yellow" id="menu-title">메뉴</SectionLabel>
          <p className={`chip ${styles.lead}`}>{menu.length > 0 ? `${menu.length}개` : "준비 중"}</p>
        </div>
        <StoreMenu store={store} items={menu} menuUrl={links?.menu ?? null} />
      </section>

      <section className={`${styles.sec} ${styles.anchor}`} id="visit" aria-labelledby="visit-title">
        <div className="sec-h">
          <SectionLabel kind="map" color="blue" id="visit-title">오시는 길</SectionLabel>
          <p className={`chip ${styles.lead}`}>3개 매장 50m 이내</p>
        </div>
        <StoreVisit store={store} />
      </section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <section className={styles.sec} aria-labelledby="reviews-title">
          <div className="sec-h">
            <SectionLabel kind="review" color="green" id="reviews-title">리뷰</SectionLabel>
          </div>
          <StoreReviews store={store} limit={2} reviewUrl={links?.review ?? null} benefit={reviewBenefit || null} />
        </section>
      )}

      <NextStop store={store} />

      {links && (
        <div className="fixed-col sticky-bar">
          <StickerButton kind="book" block href={links.booking} suffix={` — ${store.shortName}`}>예약하기</StickerButton>
        </div>
      )}
    </article>
  );
}
