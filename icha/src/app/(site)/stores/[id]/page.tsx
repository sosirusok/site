import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Art } from "@/components/art/Art";
import { StickyCta } from "@/components/site/StickyCta";
import { StoreGallery } from "@/components/site/StoreGallery";
import { StoreHero } from "@/components/site/StoreHero";
import { StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreVisit } from "@/components/site/StoreVisit";
import { formatWon } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { getStore, naverPlaceUrl } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "없는 주소" };
  return {
    title: store.name,
    description: `${store.name} — ${store.address}. 다른 두 집 영수증이 있으면 여기서 ${store.drink} 한 잔이 무료예요.`,
  };
}

/** 매장 상세 — 사진 띠, 이름·영업·주소, 무료 한 잔, 메뉴, 위치, 리뷰. 아래에 '영수증 인증하기'. */
export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const store = getStore(id);
  if (!store) notFound();

  const [menu, gifts] = await Promise.all([
    listMenu(store.id).catch(() => []),
    listMenu(store.id, { giftOnly: true }).catch(() => []),
  ]);
  const naver = naverPlaceUrl(store);

  return (
    <article className={`has-sticky ${styles.page}`} data-store={store.id}>
      <div className={`wrap ${styles.top}`}>
        <StoreGallery store={store} />
        <StoreHero store={store} />
      </div>

      <div className="band" />
      <section className="section" aria-labelledby="gift-title"><div className="wrap">
        <div className="section-h"><h2 id="gift-title" className="h2">무료 한 잔</h2></div>
        <div className={`card ${styles.giftCard}`}>
          <Art name={`coupon-${store.id}`} alt={`${store.shortName} ${store.drink} 무료 쿠폰`} className={styles.ticket} sizes="(min-width: 480px) 416px, 84vw" />
          {gifts.length === 0 && <p className={`cap ${styles.giftEmpty}`}>어떤 잔을 드릴지 정하고 있어요.</p>}
          {gifts.map((g) => (
            <div key={g.id} className={`row ${styles.giftRow}`}>
              <div className="body">
                <p className="title">{g.name}</p>
                {g.description && <p className={`sub ${styles.giftDesc}`}>{g.description}</p>}
              </div>
              {g.price != null && <s className="strike num">{formatWon(g.price)}</s>}
              <span className="tag tag-free">무료</span>
            </div>
          ))}
          <p className="cap">다른 두 집 영수증으로 받아요.</p>
        </div>
      </div></section>

      <div className="band" />
      <section className={`section ${styles.anchor}`} id="menu" aria-labelledby="menu-title"><div className="wrap">
        <div className="section-h">
          <h2 id="menu-title" className="h2">메뉴</h2>
          {menu.length > 0 && <span className="more num">{menu.length}개</span>}
        </div>
        <StoreMenu store={store} items={menu} naverUrl={naver} />
      </div></section>

      <div className="band" />
      <section className={`section ${styles.anchor}`} id="visit" aria-labelledby="visit-title"><div className="wrap">
        <div className="section-h"><h2 id="visit-title" className="h2">위치</h2></div>
        <StoreVisit store={store} />
      </div></section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <>
          <div className="band" />
          <section className="section" aria-labelledby="reviews-title"><div className="wrap">
            <div className="section-h">
              <h2 id="reviews-title" className="h2">리뷰</h2>
              {naver && <a href={naver} target="_blank" rel="noreferrer" className="more">네이버에서 더 보기</a>}
            </div>
            <StoreReviews store={store} limit={2} />
          </div></section>
        </>
      )}

      <StickyCta href={`/verify?from=${store.id}`}>영수증 인증하기</StickyCta>
    </article>
  );
}
