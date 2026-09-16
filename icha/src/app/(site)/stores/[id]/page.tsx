import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { StoreGallery } from "@/components/site/StoreGallery";
import { STORE_COPY, joinOr, josa } from "@/components/site/StoreHelpers";
import { StoreHero } from "@/components/site/StoreHero";
import { StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreHours, StoreVisit } from "@/components/site/StoreVisit";
import { formatWon } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { LOCATIONS } from "@/lib/locations";
import { getStore, giftStoresFor, naverPlaceUrl } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "없는 페이지" };
  const others = joinOr(giftStoresFor(store.id).map((s) => s.shortName));
  return {
    title: store.name,
    description: `${store.name} — ${store.address}, ${LOCATIONS[store.id].subway}. ${others} 영수증이 있으면 여기서 ${store.drink} 한 잔이 무료예요.`,
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
  const otherNames = joinOr(others.map((s) => s.shortName));
  const copy = STORE_COPY[store.id];

  return (
    <article className={`wrap ${styles.page}`} data-store={store.id}>
      <StoreHero store={store} />

      {/* 이 집에서 받는 것 — 티켓 그림이 놓이고 그 아래 품목 한 줄 */}
      <section className={styles.gift} aria-labelledby="gift-title">
        <div className="sec-head">
          <Art name="icon-coupon" width={42} />
          <h2 id="gift-title" className="h2">이 집에서 받는 것</h2>
        </div>
        <div className={styles.ticket}>
          <Art name={`coupon-${store.id}`} alt={`${store.shortName} ${store.drink} 무료 쿠폰`} sizes="(min-width: 760px) 360px, 72vw" />
        </div>
        <ul className={styles.giftList}>
          {gifts.length === 0 && <li className={styles.giftEmpty}>어떤 잔을 드릴지 매장에서 정하고 있어요.</li>}
          {gifts.map((g) => (
            <li key={g.id} className={styles.giftRow}>
              <span className={styles.giftName}>{g.name}</span>
              <span className={styles.giftDots} aria-hidden="true" />
              <span className={styles.giftPrice}>
                {g.price != null && <s>{formatWon(g.price)}</s>} <b>무료</b>
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.giftText}>
          {otherNames} 영수증이 있으면 여기서 받을 수 있어요. {store.shortName}에서 계산한 영수증으로는 반대로 저 두 집에서 받아요.
          사진 한 장 올리면 쿠폰이 전화번호에 들어가요.
        </p>
        <div className={styles.giftActions}>
          <ArtButton kind="start" href={`/verify?from=${store.id}`} width={280} />
          <Link href="/wallet" className={styles.textLink}>받아 둔 쿠폰은 쿠폰함에 있어요 →</Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="intro-title">
        <h2 id="intro-title" className={`h2 ${styles.h}`}>어떤 집이냐면</h2>
        <div className={styles.intro}>
          {copy.intro.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      <section className={styles.section} aria-label="매장 사진">
        <StoreGallery store={store} />
      </section>

      <section className={styles.section} aria-labelledby="hours-title">
        <div className="sec-head">
          <Art name="icon-history" width={42} />
          <h2 id="hours-title" className="h2">여는 시간</h2>
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
        <StoreMenu store={store} items={menu} others={others} naverUrl={naverPlaceUrl(store)} />
      </section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <section className={styles.section} aria-labelledby="reviews-title">
          <h2 id="reviews-title" className={`h2 ${styles.h}`}>다녀간 분들 말로는</h2>
          <StoreReviews store={store} limit={3} />
        </section>
      )}

      <section className={`${styles.section} ${styles.others}`} aria-labelledby="others-title">
        <h2 id="others-title" className={`h2 ${styles.h}`}>나머지 두 집</h2>
        <p className={styles.othersText}>
          {store.shortName} 영수증으로 아래 두 집에서 한 잔 받아요. {others.map((o) => `${josa(o.shortName, "은는")} ${o.drink}`).join(", ")}예요.
        </p>
        <div className={styles.badges}>
          {others.map((o) => (
            <Link key={o.id} href={`/stores/${o.id}`} className={styles.badge}>
              <Art name={`badge-${o.id}`} alt={`${o.name} 자세히`} sizes="170px" />
              <span className={styles.badgeMeta}>{LOCATIONS[o.id].subway}</span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
