import Link from "next/link";
import { BRAND } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { HomeCta } from "@/components/site/HomeCta";
import { HomeGifts, type GiftGroup } from "@/components/site/HomeGifts";
import { HomeHero, type HeroSlide } from "@/components/site/HomeHero";
import hero from "@/components/site/HomeHero.module.css";
import { HomeMapSection } from "@/components/site/HomeMapSection";
import { HomeNotice } from "@/components/site/HomeNotice";
import { SectionHead } from "@/components/site/HomeSectionHead";
import { HomeSteps } from "@/components/site/HomeSteps";
import { HomeStores } from "@/components/site/HomeStores";
import { HomeTiers } from "@/components/site/HomeTiers";
import { Marquee } from "@/components/site/Marquee";
import { firstOfKind, nightExterior } from "@/components/site/StoreHelpers";
import { quotesOf, StoreQuotes } from "@/components/site/StoreQuotes";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rules = await getRules();
  const gifts: GiftGroup[] = await Promise.all(
    STORES.map(async (store) => ({ store, items: await listMenu(store.id, { giftOnly: true }).catch(() => []) })),
  );
  const giftCount = gifts.reduce((n, g) => n + g.items.filter((m) => m.imagePath || m.hasImageData).length, 0);

  const slides: HeroSlide[] = STORES.flatMap((s, i) => {
    const img = nightExterior(s);
    return img ? [{ id: s.id, num: String(i + 1).padStart(2, "0"), name: s.shortName, drink: s.drink, src: img.src, alt: img.alt }] : [];
  });
  const names = STORES.map((s) => s.shortName);
  const tape = ["1차 → 2차", "영수증 한 장", "사이드 한 접시", ...names, "서면역 6번 출구", "도보 2~4분", "전화번호만으로 시작"];
  const ctaImage = (STORES[0] && firstOfKind(STORES[0], "drink", 2)) ?? (STORES[1] && firstOfKind(STORES[1], "drink")) ?? null;

  return (
    <>
      <HomeNotice text={rules.notice} />

      <HomeHero slides={slides}>
        <p className={`${hero.eyebrow} ${hero.enter}`}>{BRAND.unionName} · {names.join(" × ")}</p>
        <h1 id="hero-title" className={`display ${hero.title}`}>
          <span className={hero.enter}>1차 영수증 한 장,</span>
          <span className={`${hero.enter} ${hero.enterD1}`}>2차 사이드는 <em>공짜.</em></span>
        </h1>
        <p className={`lead ${hero.lead} ${hero.enter} ${hero.enterD2}`}>
          세 곳 중 한 곳에서 계산했다면 <b>나머지 두 곳</b>에서 사이드 메뉴 하나가 무료예요. 서면역 6번 출구, 걸어서 2~4분.
        </p>
        <div className={`${hero.actions} ${hero.enter} ${hero.enterD3}`}>
          <Link href="/verify" className="btn btn-lg">영수증 인증하기</Link>
          <a href="#stores" className="btn btn-lg btn-outline">매장·위치 보기</a>
        </div>
        <p className={`${hero.facts} ${hero.enter} ${hero.enterD4}`}>
          <span><b>{STORES.length}곳</b> 연합</span>
          <span>결제 후 <b>{rules.receiptValidHours}시간</b> 안에</span>
          <span>영수증 1장 = <b>사이드 1접시</b></span>
          {rules.eventActive ? null : <span><b>지금은 쉬는 중</b></span>}
        </p>
      </HomeHero>

      <Marquee items={tape} tilt />

      <section className={`section ${styles.steps}`} aria-labelledby="steps-title">
        <div className="wrap">
          <SectionHead id="steps-title" eyebrow="이렇게 받아요" title={<>계산하고, 찍고,<br />옆집에서 <em>한 접시.</em></>} sub="사진 한 장이면 돼요. 회원 가입도, 인증번호도 없어요." />
          <HomeSteps rules={rules} />
        </div>
      </section>

      <section id="stores" className={`section ${styles.stores}`} aria-labelledby="stores-title">
        <div className="wrap">
          <SectionHead id="stores-title" eyebrow="서면 2차 연합" title={<>세 곳, <em>세 가지 술.</em></>} sub="막걸리, 생맥주, 소주. 영수증을 받은 곳 말고 나머지 두 곳에서 사이드를 드려요." />
          <HomeStores />
        </div>
      </section>

      {giftCount > 0 && (
        <section className={`section ${styles.gifts}`} aria-labelledby="gifts-title">
          <div className="wrap">
            <SectionHead
              id="gifts-title"
              eyebrow="공짜로 받을 수 있는 사이드"
              title={<>영수증 한 장에<br />이 중 <em>한 접시.</em></>}
              sub={`지금 고를 수 있는 사이드 ${giftCount}가지. 매장 사정에 따라 바뀔 수 있어요.`}
            />
            <HomeGifts groups={gifts} />
          </div>
        </section>
      )}

      <HomeMapSection />

      <section className={`section ${styles.tiers}`} aria-labelledby="tiers-title">
        <div className="wrap">
          <SectionHead id="tiers-title" eyebrow="자주 오면 등급" title={<>많이 마신 만큼<br /><em>대접</em>받아요.</>} sub="승인된 영수증 금액이 번호에 쌓여요. 등급이 오르면 사장님들이 쿠폰을 따로 넣어 드려요." />
          <HomeTiers rules={rules} />
        </div>
      </section>

      <section className={`section ${styles.quotes}`} aria-labelledby="quotes-title">
        <div className="wrap">
          <SectionHead id="quotes-title" eyebrow="다녀간 분들" title={<>네이버에 남긴<br /><em>진짜 리뷰.</em></>} />
          <StoreQuotes quotes={quotesOf(STORES, 3)} limitMobile={6} />
        </div>
      </section>

      <Marquee items={["1차는 마음대로", "2차는 우리가", ...names, "사이드 한 접시 무료", "전화번호만으로 시작"]} tone="red" speed={46} />
      <HomeCta
        image={ctaImage}
        title={<>영수증,<br />아직 <em>버리지</em> 마세요.</>}
        sub={BRAND.tagline}
        primary={{ href: "/verify", label: "영수증 인증하기" }}
        secondary={{ href: "/guide", label: "이용 방법·유의사항" }}
      />
    </>
  );
}
