import type { Metadata } from "next";
import Image from "next/image";
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
import { listMenu } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { getStore } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** DB 에 배경 뺀 품목 사진이 없을 때 혜택 조각 옆에 붙는 키트의 오려 낸 술(없으면 아무것도 안 붙는다) */
const CUT: Record<StoreId, string> = { tokyo: "cut-beer", joseon: "cut-makgeolli", wareureu: "cut-yogurt" };

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
 * 매장 화면 — 밤 사진 위에 포스터 간판 조각, 어두운 띠(상태 칩·오늘 영업시간·별점), 종이(영업시간·주소·전화),
 * 특별 혜택(포스터 혜택 조각 + 오려 낸 품목 사진 + 찢은 종이: 혜택 한 줄·품목·조건), 사진(폴라로이드 다섯, 캡션 없음), 메뉴판(크림 종이),
 * 오시는 길(테이프 지도), 리뷰(종이 조각), 다음 매장(종이 한 줄). 정보 글자는 전부 본문 글꼴, 명사구·합니다체.
 * 초록 버튼은 아래 고정 [예약하기] 하나. 섹션 제목·버튼·도장은 키트(label-*, btn-book, stamp-free)가 있으면 그 그림.
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
  /** 배경을 뺀 PNG 가 있는 혜택 품목(도쿄스탠드 생맥주) — 포스터 오려 붙인 듯 혜택 조각 옆에 크게 */
  const cutout = gifts.find((g) => g.imagePath && /\.png$/i.test(g.imagePath)) ?? null;
  const notice = rules.storeNotices[store.id]?.trim() ?? "";
  const reviewBenefit = rules.reviewBenefit[store.id]?.trim() ?? "";
  /** 혜택 한 줄(고정형) — 품목은 DB 혜택 이름들, 없으면 포스터의 혜택 이름 */
  const giftWhat = gifts.length ? gifts.map((g) => g.name).join(" 또는 ") : store.benefitLabel;

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
            <Piece name={benefitOf(store.id)} rotate={-2} sizes="250px" className={`tape-tl ${styles.benefit}`} />
            {cutout ? (
              <Image src={cutout.imagePath!} alt={cutout.name} width={160} height={320} sizes="110px" className={styles.cutout} draggable={false} />
            ) : (
              <KitPiece name={CUT[store.id]} bare sizes="110px" className={styles.cutout} />
            )}
          </div>
          <div className={`scrap ${styles.giftScrap}`} style={{ "--r": "1.5deg" } as CSSProperties}>
            <div className={`scrap-in ${styles.giftIn}`}>
              <p className={`${styles.giftHead} ${cutout ? styles.giftHeadClear : ""}`}>다른 매장 쿠폰 제시 시 {giftWhat} 무료</p>
              {gifts.map((g) => (
                <div key={g.id} className={styles.gift}>
                  {g.id !== cutout?.id && <MenuThumb m={g} size={64} />}
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
              {gifts.length > 1 && <p className={styles.giftPick}>택 1</p>}
              <p className={styles.giftRule}>이용 조건 · {BRAND.condition}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sec} aria-labelledby="photo-title">
        <div className="sec-h">
          <h2 id="photo-title" className="plate plate-blue">사진</h2>
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
        <div className="fixed-col sticky-cta">
          <StickerButton kind="book" block href={links.booking}>예약하기<span className="sr-only"> — {store.shortName}</span></StickerButton>
        </div>
      )}
    </article>
  );
}
