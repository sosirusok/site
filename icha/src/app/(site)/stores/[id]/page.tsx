import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextStop } from "@/components/site/NextStop";
import { StoreGallery } from "@/components/site/StoreGallery";
import { StoreHero } from "@/components/site/StoreHero";
import { MenuThumb, StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreVisit } from "@/components/site/StoreVisit";
import { BRAND, formatWon } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { getStore } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "없는 주소" };
  return {
    title: store.name,
    description: `${BRAND.name} ${store.course.n}차 · ${store.course.line} ${store.name} — ${store.address}. 다른 매장에서 받은 쿠폰으로 ${store.benefitLabel} 특별 혜택을 드려요.`,
  };
}

/** 가게 화면 — 밤 사진과 네온 간판, 오늘 소식, 특별 혜택, 사진, 메뉴, 위치, 리뷰, 다음 집. 초록 버튼은 아래 고정 예약하기 하나. */
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

  return (
    <article className={styles.page} data-store={store.id}>
      <StoreHero store={store} />

      {notice && (
        <p className={styles.notice}>
          <span className={styles.noticeDay}>오늘</span>
          {notice}
        </p>
      )}

      <section className={`wrap ${styles.sec}`} aria-labelledby="gift-title">
        <div className={styles.head}>
          <p className={`kicker ${styles.kick}`}>다른 집 쿠폰으로</p>
          <h2 id="gift-title" className={`tube ${styles.title}`}>여기서 받는 것</h2>
        </div>
        {gifts.length === 0 ? (
          <p className={styles.giftEmpty}>어떤 혜택을 드릴지 정하고 있어요.</p>
        ) : (
          <div className={styles.gifts}>
            {gifts.map((g) => (
              <div key={g.id} className={styles.giftRow}>
                <div className={styles.giftBody}>
                  <p className={styles.giftName}>{g.name}</p>
                  {g.description && <p className={styles.giftDesc}>{g.description}</p>}
                </div>
                <span className={`num ${styles.giftPrice}`}>
                  {g.price != null && <s className="strike">{formatWon(g.price)}</s>}
                  <span className={styles.giftFree}>무료</span>
                </span>
                <MenuThumb m={g} />
              </div>
            ))}
          </div>
        )}
        {gifts.length > 1 && <p className={styles.giftPick}>둘 중 하나를 골라요.</p>}
        <div className={styles.giftRule}>
          <p>다른 매장에서 받은 쿠폰으로 받아요</p>
          <p>{BRAND.condition}</p>
        </div>
      </section>

      <section className={styles.secTight} aria-labelledby="photo-title">
        <div className={`wrap ${styles.head}`}>
          <p className={`kicker ${styles.kick}`}>{store.shortName}의 밤</p>
          <h2 id="photo-title" className={`tube ${styles.title}`}>사진</h2>
        </div>
        <StoreGallery store={store} photoUrl={links?.photo ?? null} />
      </section>

      <section className={`wrap ${styles.sec} ${styles.anchor}`} id="menu" aria-labelledby="menu-title">
        <div className={styles.head}>
          <p className={`kicker ${styles.kick}`}>{menu.length > 0 ? `${menu.length}가지` : "정리 중"}</p>
          <h2 id="menu-title" className={`tube ${styles.title}`}>메뉴</h2>
        </div>
        <StoreMenu store={store} items={menu} menuUrl={links?.menu ?? null} />
      </section>

      <section className={`wrap ${styles.sec} ${styles.anchor}`} id="visit" aria-labelledby="visit-title">
        <div className={styles.head}>
          <p className={`kicker ${styles.kick}`}>서면 50m 안</p>
          <h2 id="visit-title" className={`tube ${styles.title}`}>오시는 길</h2>
        </div>
        <StoreVisit store={store} />
      </section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <section className={`wrap ${styles.sec}`} aria-labelledby="reviews-title">
          <div className={styles.head}>
            <p className={`kicker ${styles.kick}`}>다녀온 사람들</p>
            <h2 id="reviews-title" className={`tube ${styles.title}`}>리뷰</h2>
          </div>
          <StoreReviews store={store} limit={2} reviewUrl={links?.review ?? null} benefit={reviewBenefit || null} />
        </section>
      )}

      <NextStop store={store} />

      {links && (
        <div className="fixed-col sticky-cta">
          <a className="btn btn-naver btn-block" href={links.booking} target="_blank" rel="noreferrer">예약하기<span className="sr-only"> — {store.shortName}</span></a>
        </div>
      )}
    </article>
  );
}
