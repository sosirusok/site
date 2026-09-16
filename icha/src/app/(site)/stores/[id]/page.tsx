import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { StoreGallery } from "@/components/site/StoreGallery";
import { STORE_COPY } from "@/components/site/StoreHelpers";
import { StoreHero } from "@/components/site/StoreHero";
import { StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreHours, StoreVisit } from "@/components/site/StoreVisit";
import { formatWon } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { getStore, giftStoresFor, naverPlaceUrl } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "없는 페이지" };
  return {
    title: store.name,
    description: `${store.name} — ${store.address}. 다른 두 집 영수증이 있으면 여기서 ${store.drink} 한 잔이 무료예요.`,
  };
}

export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const store = getStore(id);
  if (!store) notFound();

  const [menu, gifts] = await Promise.all([
    listMenu(store.id).catch(() => []),
    listMenu(store.id, { giftOnly: true }).catch(() => []),
  ]);
  const others = giftStoresFor(store.id);

  return (
    <article className={`wrap ${styles.page}`} data-store={store.id}>
      <StoreHero store={store} />

      {/* 무료 한 잔 — 티켓, 품목 한 줄, 한 문장, 시작하기 */}
      <section className={styles.gift} aria-label="무료 한 잔">
        <div className={styles.ticket}>
          <Art name={`coupon-${store.id}`} alt={`${store.shortName} ${store.drink} 무료 쿠폰`} sizes="(min-width: 760px) 300px, 58vw" />
        </div>
        <div className={styles.giftBody}>
          {gifts.length === 0 && <p className={styles.giftRow}>어떤 잔을 드릴지 정하고 있어요.</p>}
          {gifts.map((g) => (
            <p key={g.id} className={styles.giftRow}>
              <b>{g.name}</b>
              {g.price != null && <s>{formatWon(g.price)}</s>}
              <em>무료</em>
            </p>
          ))}
          <p className={styles.giftText}>다른 두 집 영수증이 있으면 여기서 받아요.</p>
          <ArtButton kind="start" href={`/verify?from=${store.id}`} width={280} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="intro-title">
        <h2 id="intro-title" className={`h2 ${styles.h}`}>소개</h2>
        <p className={styles.intro}>{STORE_COPY[store.id].intro}</p>
      </section>

      <section className={styles.section} aria-label="매장 사진">
        <StoreGallery store={store} />
      </section>

      <section className={styles.section} aria-labelledby="hours-title">
        <div className="sec-head">
          <Art name="icon-history" width={42} />
          <h2 id="hours-title" className="h2">영업시간</h2>
        </div>
        <StoreHours store={store} />
      </section>

      <section className={styles.section} id="visit" aria-labelledby="visit-title">
        <div className="sec-head">
          <Art name="icon-store" width={42} />
          <h2 id="visit-title" className="h2">오시는 길</h2>
        </div>
        <StoreVisit store={store} />
      </section>

      <section className={styles.section} id="menu" aria-labelledby="menu-title">
        <div className="sec-head">
          <Art name="icon-receipt" width={42} />
          <h2 id="menu-title" className="h2">메뉴판</h2>
        </div>
        <StoreMenu store={store} items={menu} naverUrl={naverPlaceUrl(store)} />
      </section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <section className={styles.section} aria-labelledby="reviews-title">
          <h2 id="reviews-title" className={`h2 ${styles.h}`}>리뷰</h2>
          <StoreReviews store={store} limit={2} />
        </section>
      )}

      <section className={`${styles.section} ${styles.others}`} aria-labelledby="others-title">
        <h2 id="others-title" className={`h2 ${styles.h}`}>나머지 두 집</h2>
        <div className={styles.badges}>
          {others.map((o) => (
            <Link key={o.id} href={`/stores/${o.id}`} className={styles.badge}>
              <Art name={`badge-${o.id}`} alt={`${o.name} 자세히`} sizes="165px" />
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
