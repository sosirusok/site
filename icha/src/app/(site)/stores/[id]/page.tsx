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

/** 매장 상세 — 사진 띠·이름·예약 버튼, 오늘 소식, 특별 혜택, 다음 집, 메뉴, 위치, 리뷰. 아래 고정 버튼은 네이버 플레이스. */
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
      <div className={`wrap ${styles.top}`}>
        <StoreGallery store={store} photoUrl={links?.photo ?? null} />
        <StoreHero store={store} />
      </div>

      {notice && (
        <p className={styles.notice}>
          <span className={styles.noticeDay}>오늘</span>
          {notice}
        </p>
      )}

      <div className="band" />
      <section className="section" aria-labelledby="gift-title"><div className="wrap">
        <div className="section-h">
          <h2 id="gift-title" className="h2-event">특별 혜택</h2>
        </div>
        <div className={`card-neon ${styles.giftCard}`}>
          {gifts.length === 0 ? (
            <p className={`cap ${styles.giftEmpty}`}>어떤 혜택을 드릴지 정하고 있어요.</p>
          ) : (
            <ul>
              {gifts.map((g) => (
                <li key={g.id} className={`row ${styles.giftRow}`}>
                  <div className="body">
                    <p className="title">{g.name}</p>
                    {g.description && <p className={`sub ${styles.giftDesc}`}>{g.description}</p>}
                  </div>
                  <span className={`num ${styles.giftPrice}`}>
                    {g.price != null && <s className="strike">{formatWon(g.price)}</s>}
                    <span className="tag tag-free">무료</span>
                  </span>
                  <MenuThumb m={g} />
                </li>
              ))}
            </ul>
          )}
          {gifts.length > 1 && <p className={`cap ${styles.giftPick}`}>둘 중 하나를 골라요.</p>}
          <div className={styles.giftRule}>
            <p className="cap">다른 매장에서 받은 쿠폰으로 받아요</p>
            <p className="cap">{BRAND.condition}</p>
          </div>
        </div>
      </div></section>

      <div className="band" />
      <section className="section" aria-labelledby="next-title"><div className="wrap">
        <div className="section-h"><h2 id="next-title" className="h2-event">다음 집</h2></div>
        <NextStop store={store} />
      </div></section>

      <div className="band" />
      <section className={`section ${styles.anchor}`} id="menu" aria-labelledby="menu-title"><div className="wrap">
        <div className="section-h">
          <h2 id="menu-title" className="h2-event">메뉴</h2>
          {menu.length > 0 && <span className="more num">{menu.length}개</span>}
        </div>
        <StoreMenu store={store} items={menu} menuUrl={links?.menu ?? null} />
      </div></section>

      <div className="band" />
      <section className={`section ${styles.anchor}`} id="visit" aria-labelledby="visit-title"><div className="wrap">
        <div className="section-h"><h2 id="visit-title" className="h2-event">위치</h2></div>
        <StoreVisit store={store} />
      </div></section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <>
          <div className="band" />
          <section className="section" aria-labelledby="reviews-title"><div className="wrap">
            <div className="section-h"><h2 id="reviews-title" className="h2-event">리뷰</h2></div>
            <StoreReviews store={store} limit={2} reviewUrl={links?.review ?? null} benefit={reviewBenefit || null} />
          </div></section>
        </>
      )}

      {links && (
        <div className="fixed-col sticky-cta">
          <a className="btn btn-naver btn-block" href={links.home} target="_blank" rel="noreferrer">네이버 플레이스에서 보기</a>
        </div>
      )}
    </article>
  );
}
