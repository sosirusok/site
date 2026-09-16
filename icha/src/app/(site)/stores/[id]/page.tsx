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
  if (!store) return { title: "없는 주소" };
  return {
    title: store.name,
    description: `${BRAND.name} ${store.course.n}차 · ${store.course.line} ${store.name} — ${store.address}. 다른 매장에서 받은 쿠폰으로 ${store.benefitLabel} 특별 혜택을 드려요.`,
  };
}

/**
 * 가게 화면 — 밤 사진 위에 포스터 간판 조각, 손글씨 영업 한 줄, 종이(주소·전화),
 * 특별 혜택(포스터 혜택 조각 + 오려 낸 품목 사진 + 찢은 종이), 사진(폴라로이드 다섯), 메뉴판(크림 종이), 오시는 길(테이프 지도), 리뷰(종이 조각), 다음 집(손글씨 화살표).
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

  return (
    <article className={styles.page} data-store={store.id}>
      <StoreHero store={store} />

      {notice && (
        <div className={`scrap ${styles.notice}`} style={{ "--r": "1deg" } as CSSProperties}>
          <p className={`scrap-in hand ${styles.noticeIn}`}><b className={styles.noticeDay}>오늘</b> {notice}</p>
        </div>
      )}

      <section className={styles.sec} aria-labelledby="gift-title">
        <div className="sec-h">
          <SectionLabel kind="benefit" color="red" id="gift-title">특별 혜택</SectionLabel>
          <p className={`hand hand-w ${styles.lead}`}>다른 집 쿠폰으로 여기서 받는 것</p>
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
              {gifts.length === 0 ? (
                <p className={`hand ${styles.giftEmpty}`}>어떤 혜택을 드릴지 정하고 있어요.</p>
              ) : (
                gifts.map((g) => (
                  <div key={g.id} className={styles.gift}>
                    {g.id !== cutout?.id && <MenuThumb m={g} size={64} />}
                    <div className={styles.giftBody}>
                      <p className={styles.giftName}>{g.name}</p>
                      {g.description && <p className={styles.giftDesc}>{g.description}</p>}
                      <p className={styles.giftPrice}>
                        {g.price != null && <s className="strike num">{formatWon(g.price)}</s>}
                        <KitPiece name="stamp-free" bare sizes="56px" className={styles.giftStamp} fallback={<span className={`stamp ${styles.giftFree}`}>무료</span>} />
                      </p>
                    </div>
                  </div>
                ))
              )}
              {gifts.length > 1 && <p className={`hand ${styles.giftPick}`}>둘 중 하나를 골라요</p>}
              <p className={styles.giftRule}>다른 매장에서 받은 쿠폰으로 · {BRAND.condition}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sec} aria-labelledby="photo-title">
        <div className="sec-h">
          <h2 id="photo-title" className="plate plate-blue">사진</h2>
          <p className={`hand hand-w ${styles.lead}`}>{store.shortName}의 밤</p>
        </div>
        <StoreGallery store={store} photoUrl={links?.photo ?? null} />
      </section>

      <section className={`${styles.sec} ${styles.anchor}`} id="menu" aria-labelledby="menu-title">
        <div className="sec-h">
          <SectionLabel kind="menu" color="yellow" id="menu-title">메뉴</SectionLabel>
          <p className={`hand hand-w ${styles.lead}`}>{menu.length > 0 ? `${menu.length}가지` : "정리 중"}</p>
        </div>
        <StoreMenu store={store} items={menu} menuUrl={links?.menu ?? null} />
      </section>

      <section className={`${styles.sec} ${styles.anchor}`} id="visit" aria-labelledby="visit-title">
        <div className="sec-h">
          <SectionLabel kind="map" color="blue" id="visit-title">오시는 길</SectionLabel>
          <p className={`hand hand-w ${styles.lead}`}>서면 50m 안</p>
        </div>
        <StoreVisit store={store} />
      </section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <section className={styles.sec} aria-labelledby="reviews-title">
          <div className="sec-h">
            <SectionLabel kind="review" color="green" id="reviews-title">리뷰</SectionLabel>
            <p className={`hand hand-w ${styles.lead}`}>다녀온 사람들</p>
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
