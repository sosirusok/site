import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listMenu } from "@/lib/db/queries";
import { LOCATIONS } from "@/lib/locations";
import { getStore, giftStoresFor, naverPlaceUrl, STORES } from "@/lib/stores";
import { StoreGallery } from "@/components/site/StoreGallery";
import { joinOr, openStatus, todayHoursText } from "@/components/site/StoreHelpers";
import { StoreHero } from "@/components/site/StoreHero";
import { StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreVisit } from "@/components/site/StoreVisit";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "페이지를 찾을 수 없습니다" };
  const others = joinOr(giftStoresFor(store.id).map((s) => s.shortName));
  return {
    title: store.name,
    description: `${store.name} — ${store.address}. ${LOCATIONS[store.id].subway}. 이 매장 영수증 인증 시 ${others}에서 사이드 메뉴 1개 무료.`,
  };
}

export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const store = getStore(id);
  if (!store) notFound();

  const menu = await listMenu(store.id).catch(() => []);
  const naver = naverPlaceUrl(store);
  const others = giftStoresFor(store.id);
  const introParas = store.intro.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const now = new Date();

  return (
    <article className={styles.page}>
      <StoreHero store={store} />

      <div className="wrap">
        <section className={styles.section} aria-label="매장 사진">
          <StoreGallery store={store} />
        </section>

        <section className={styles.section} aria-labelledby="intro-title">
          <div className="sec-head">
            <h2 id="intro-title" className="h2">매장 소개</h2>
          </div>
          <div className={styles.intro}>
            {introParas.map((p, i) => <p key={i} className={styles.introPara}>{p}</p>)}
          </div>
        </section>

        <section className={styles.section} id="visit" aria-labelledby="visit-title">
          <div className="sec-head">
            <h2 id="visit-title" className="h2">영업시간 · 오시는 길</h2>
            {naver && <a href={naver} target="_blank" rel="noreferrer" className="more">네이버 플레이스</a>}
          </div>
          <StoreVisit store={store} />
        </section>

        <section className={styles.section} id="menu" aria-labelledby="menu-title">
          <div className="sec-head">
            <h2 id="menu-title" className="h2">메뉴</h2>
          </div>
          <StoreMenu store={store} items={menu} others={others} naverUrl={naver} />
        </section>

        {(store.quotes.length > 0 || store.naverRating) && (
          <section className={styles.section} aria-labelledby="reviews-title">
            <div className="sec-head">
              <h2 id="reviews-title" className="h2">고객 리뷰</h2>
            </div>
            <StoreReviews store={store} limit={3} />
          </section>
        )}

        <section className={styles.section} aria-labelledby="others-title">
          <div className="sec-head">
            <h2 id="others-title" className="h2">다른 참여 매장</h2>
          </div>
          <p className={styles.othersNote}>{store.shortName} 영수증을 인증하면 아래 두 매장 중 한 곳에서 사이드 메뉴 1개를 무료로 받을 수 있습니다.</p>
          <ul className={styles.others}>
            {others.map((o) => {
              const st = openStatus(o, now);
              const num = STORES.findIndex((s) => s.id === o.id) + 1;
              return (
                <li key={o.id} className={styles.other}>
                  <div className={styles.otherBody}>
                    <p className={styles.otherKicker}>{num}. {o.drink}</p>
                    <p className={styles.otherName}>{o.name}</p>
                    <p className={styles.otherMeta}>오늘 {todayHoursText(st)} · {LOCATIONS[o.id].subway}</p>
                  </div>
                  <Link href={`/stores/${o.id}`} className="btn btn-outline btn-sm">매장 정보</Link>
                </li>
              );
            })}
          </ul>
          <div className={styles.actions}>
            <Link href={`/verify?from=${store.id}`} className="btn btn-red">영수증 인증</Link>
            <Link href="/#stores" className="btn btn-outline">참여 매장 목록</Link>
          </div>
        </section>
      </div>
    </article>
  );
}
