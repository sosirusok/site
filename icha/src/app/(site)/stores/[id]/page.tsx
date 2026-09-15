import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listMenu } from "@/lib/db/queries";
import { getStore, giftStoresFor, naverPlaceUrl } from "@/lib/stores";
import { SectionHead } from "@/components/site/HomeSectionHead";
import { josa } from "@/components/site/StoreHelpers";
import { StoreGallery } from "@/components/site/StoreGallery";
import { StoreHero } from "@/components/site/StoreHero";
import { StoreMenu } from "@/components/site/StoreMenu";
import { StoreNext } from "@/components/site/StoreNext";
import { StoreQuotes } from "@/components/site/StoreQuotes";
import { StoreVisit } from "@/components/site/StoreVisit";
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

  const menu = await listMenu(store.id).catch(() => []);
  const naver = naverPlaceUrl(store);
  const others = giftStoresFor(store.id);
  const introParas = store.intro.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const menuBoards = store.images.filter((i) => i.kind === "menu");
  const otherNames = others.map((s, i) => (i < others.length - 1 ? josa(s.shortName, "이나") : s.shortName)).join(" ");

  return (
    <article>
      <StoreHero store={store} />

      <section className={styles.gallery} aria-label="매장 사진">
        <StoreGallery store={store} />
      </section>

      <div className="wrap">
        <section className={styles.section} aria-labelledby="intro-title">
          <SectionHead id="intro-title" eyebrow="이런 곳이에요" title={<>{josa(store.shortName, "은는")}<br /><em>{store.drink}</em> 집.</>} />
          <div className={styles.introGrid}>
            <div className={`rise ${styles.intro}`}>
              {introParas.map((p, i) => <p key={i} className={styles.introPara}>{p}</p>)}
            </div>
            {store.keywords.length > 0 && (
              <ul className={`rise rise-d1 ${styles.keywords}`} aria-label="키워드">
                {store.keywords.map((k) => <li key={k} className={styles.keyword}>{k}</li>)}
              </ul>
            )}
          </div>
        </section>

        <section className={styles.section} id="visit" aria-labelledby="visit-title">
          <SectionHead id="visit-title" eyebrow="영업시간과 위치" title={<>언제, <em>어디로</em></>} />
          <div className="rise"><StoreVisit store={store} /></div>
        </section>

        <section className={styles.section} id="menu" aria-labelledby="menu-title">
          <SectionHead id="menu-title" eyebrow="메뉴" title={<>뭘 <em>먹을까</em></>} sub={`'무료 사이드' 표시가 있는 메뉴는 ${otherNames} 영수증으로 무료예요.`} />
          <div className="rise"><StoreMenu store={store} items={menu} others={others} naverUrl={naver} menuBoards={menuBoards} /></div>
        </section>

        {store.quotes.length > 0 && (
          <section className={styles.section} aria-labelledby="quotes-title">
            <SectionHead id="quotes-title" eyebrow="다녀간 분들" title={<>이런 말을 <em>남겼어요</em></>} />
            <StoreQuotes quotes={store.quotes.slice(0, 3)} />
          </section>
        )}

        <section className={`${styles.section} ${styles.next}`} aria-labelledby="next-title">
          <SectionHead id="next-title" eyebrow="2차" title={<>{store.shortName} 영수증이면,<br />사이드는 <em>여기서.</em></>} sub="영수증을 받은 매장에서는 혜택이 없어요. 아래 두 곳 중 한 곳에서 한 접시." />
          <StoreNext store={store} others={others} />
        </section>
      </div>
    </article>
  );
}
