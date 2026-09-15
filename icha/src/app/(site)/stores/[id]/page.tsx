import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listMenu } from "@/lib/db/queries";
import { getStore, giftStoresFor, naverPlaceUrl, STORES } from "@/lib/stores";
import { ArrowIcon, DrinkIcon } from "@/components/ui/icons";
import { SectionHead } from "@/components/site/HomeSectionHead";
import { StoreContact } from "@/components/site/StoreContact";
import { StoreGallery } from "@/components/site/StoreGallery";
import { StoreHero } from "@/components/site/StoreHero";
import { StoreHours } from "@/components/site/StoreHours";
import { StoreMenu } from "@/components/site/StoreMenu";
import { StoreQuotes } from "@/components/site/StoreQuotes";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "매장을 찾을 수 없어요" };
  const others = giftStoresFor(store.id).map((s) => s.shortName).join("·");
  return {
    title: store.shortName,
    description: `${store.name} — ${store.headline} 이 매장 영수증으로 ${others}에서 사이드 한 접시.`,
  };
}

export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const store = getStore(id);
  if (!store) notFound();

  const menu = await listMenu(store.id);
  const naver = naverPlaceUrl(store);
  const others = giftStoresFor(store.id);
  const introParas = store.intro.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <article data-store={store.id}>
      <StoreHero store={store} />

      <div className={`wrap ${styles.body}`}>
        <section className={styles.gallery} aria-label="매장 사진">
          <StoreGallery store={store} />
        </section>

        <section className={styles.section} aria-labelledby="intro-title">
          <SectionHead id="intro-title" num="소개" title="이런 곳이에요" />
          <div className={styles.introGrid}>
            <div className={`rise ${styles.intro}`}>
              {introParas.length ? (
                introParas.map((p, i) => <p key={i} className={styles.introPara}>{p}</p>)
              ) : (
                <p className={styles.introPara}>{store.headline} 소개 글은 정리하고 있어요.</p>
              )}
            </div>
            {store.keywords.length > 0 && (
              <ul className={`rise rise-d1 ${styles.keywords}`} aria-label="키워드">
                {store.keywords.map((k) => (
                  <li key={k} className={`mono ${styles.keyword}`}>#{k}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="visit-title">
          <SectionHead id="visit-title" num="찾아가기" title="영업시간과 위치" />
          <div className={styles.visitGrid}>
            <div className={`rise ${styles.visitCol}`}>
              <h3 className={`mono ${styles.colLabel}`}>영업시간</h3>
              <StoreHours store={store} naverUrl={naver} />
            </div>
            <div className={`rise rise-d1 ${styles.visitCol}`}>
              <h3 className={`mono ${styles.colLabel}`}>주소 · 전화</h3>
              <StoreContact store={store} />
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="menu-title">
          <SectionHead
            id="menu-title"
            num="메뉴"
            title="메뉴"
            sub={`'무료 사이드' 표시가 있는 메뉴는 ${others.map((s) => s.shortName).join("이나 ")} 영수증으로 무료예요.`}
          />
          <div className="rise">
            <StoreMenu store={store} items={menu} naverUrl={naver} />
          </div>
        </section>

        {store.quotes.length > 0 && (
          <section className={styles.section} aria-labelledby="quotes-title">
            <SectionHead id="quotes-title" num="다녀간 분들" title="이런 말을 남겼어요" />
            <StoreQuotes quotes={store.quotes} />
          </section>
        )}

        <section className={`${styles.section} ${styles.next}`} aria-labelledby="next-title">
          <SectionHead id="next-title" num="2차" title={`${store.shortName} 영수증이면, 사이드는 여기서`} sub="영수증을 받은 매장에서는 혜택이 없어요. 아래 두 곳 중 한 곳에서 한 접시." />
          <ul className={styles.nextList}>
            {others.map((s, i) => (
              <li key={s.id} data-store={s.id} className={`rise rise-d${i + 1}`}>
                <Link href={`/stores/${s.id}`} className={styles.nextCard}>
                  <span className={styles.nextIcon}><DrinkIcon drink={s.drink} size={30} /></span>
                  <span className={styles.nextText}>
                    <span className={`mono ${styles.nextNum}`}>{String(STORES.findIndex((x) => x.id === s.id) + 1).padStart(2, "0")} · {s.drink}</span>
                    <span className={`serif ${styles.nextName}`}>{s.shortName}</span>
                    <span className={styles.nextHeadline}>{s.headline}</span>
                  </span>
                  <ArrowIcon size={22} className={styles.nextArrow} />
                </Link>
              </li>
            ))}
          </ul>
          <div className={`rise rise-d2 ${styles.nextCta}`}>
            <Link href={`/verify?from=${store.id}`} className="btn btn-lg btn-store">
              {store.shortName} 영수증 인증하기 <ArrowIcon size={20} />
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
