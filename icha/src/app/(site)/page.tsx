import Link from "next/link";
import { BRAND, formatWon } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { subwaySummary } from "@/lib/locations";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { HomeGifts, type GiftGroup } from "@/components/site/HomeGifts";
import { HomeHero, type HeroSlide } from "@/components/site/HomeHero";
import hero from "@/components/site/HomeHero.module.css";
import { HomeMapSection } from "@/components/site/HomeMapSection";
import { HomeNotice } from "@/components/site/HomeNotice";
import { HomeSteps } from "@/components/site/HomeSteps";
import { HomeStores } from "@/components/site/HomeStores";
import { HomeTiers } from "@/components/site/HomeTiers";
import { firstOfKind, heroImage } from "@/components/site/StoreHelpers";
import { StoreReviews } from "@/components/site/StoreReviews";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rules = await getRules();
  const gifts: GiftGroup[] = await Promise.all(
    STORES.map(async (store) => ({ store, items: await listMenu(store.id, { giftOnly: true }).catch(() => []) })),
  );

  // 히어로: 매장마다 외관(대표) 한 장 + 내부 한 장
  const slides: HeroSlide[] = STORES.flatMap((s) => {
    const out: HeroSlide[] = [];
    const ext = heroImage(s);
    const inn = firstOfKind(s, "interior");
    if (ext) out.push({ id: `${s.id}-ext`, src: ext.src, alt: ext.alt, label: `${s.shortName} 외관` });
    if (inn) out.push({ id: `${s.id}-int`, src: inn.src, alt: inn.alt, label: `${s.shortName} 내부` });
    return out;
  });
  const names = STORES.map((s) => s.shortName);

  return (
    <>
      <HomeNotice text={rules.notice} />

      <HomeHero slides={slides}>
        <p className={hero.eyebrow}>{BRAND.unionName} · {names.join(" × ")}</p>
        <h1 id="hero-title" className={`h1 ${hero.title}`}>참여 매장 영수증 인증 시 다른 매장 사이드 메뉴 1개 무료</h1>
        <p className={`lead ${hero.lead}`}>{BRAND.tagline} 세 매장 모두 {subwaySummary()} 거리에 있습니다.</p>
        <div className={hero.actions}>
          <Link href="/verify" className="btn btn-red btn-lg">영수증 인증</Link>
          <a href="#stores" className={`btn btn-lg ${hero.btnLight}`}>참여 매장 보기</a>
        </div>
      </HomeHero>

      {!rules.eventActive && (
        <p className={`wrap ${styles.paused}`}>현재 영수증 인증을 받지 않습니다. 이미 발급된 쿠폰은 만료일까지 사용할 수 있습니다.</p>
      )}

      <section id="how" className={`section ${styles.section}`} aria-labelledby="how-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="how-title" className="h2">이용 방법</h2>
            <Link href="/guide" className="more">이용 안내 전체 보기</Link>
          </div>
          <HomeSteps rules={rules} />
        </div>
      </section>

      <section id="stores" className={`section ${styles.section} ${styles.alt}`} aria-labelledby="stores-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="stores-title" className="h2">참여 매장</h2>
            <span className="more">{STORES.length}개 매장 · {subwaySummary()}</span>
          </div>
          <HomeStores />
        </div>
      </section>

      <section id="menu" className={`section ${styles.section}`} aria-labelledby="menu-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="menu-title" className="h2">무료 사이드 메뉴</h2>
          </div>
          <p className={styles.note}>영수증 1장당 아래 메뉴 중 1개를 고를 수 있습니다. 영수증을 받은 매장의 메뉴는 선택할 수 없습니다. 메뉴는 매장 사정에 따라 바뀔 수 있습니다.</p>
          <HomeGifts groups={gifts} />
        </div>
      </section>

      <section id="map" className={`section ${styles.section} ${styles.alt}`} aria-labelledby="map-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="map-title" className="h2">오시는 길</h2>
            <span className="more">{subwaySummary()}</span>
          </div>
          <HomeMapSection />
        </div>
      </section>

      <section className={`section ${styles.section}`} aria-labelledby="tiers-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="tiers-title" className="h2">등급 혜택</h2>
          </div>
          <HomeTiers rules={rules} />
        </div>
      </section>

      {STORES.some((s) => s.quotes.length > 0 || s.naverRating) && (
        <section className={`section ${styles.section} ${styles.alt}`} aria-labelledby="reviews-title">
          <div className="wrap">
            <div className="sec-head">
              <h2 id="reviews-title" className="h2">고객 리뷰</h2>
              <span className="more">네이버 플레이스 방문자 리뷰</span>
            </div>
            <div className={styles.reviews}>
              {STORES.map((s, i) => <StoreReviews key={s.id} store={s} limit={2} index={i + 1} />)}
            </div>
          </div>
        </section>
      )}

      <section className={`section ${styles.section}`} aria-labelledby="guide-title">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="guide-title" className="h2">이용 안내</h2>
          </div>
          <div className={styles.guide}>
            <dl className={`dl ${styles.guideDl}`}>
              <dt>인정 시간</dt><dd>결제 후 {rules.receiptValidHours}시간 이내 인증</dd>
              {rules.minAmount > 0 && <><dt>최소 금액</dt><dd>{formatWon(rules.minAmount)} 이상 결제 영수증</dd></>}
              <dt>하루 한도</dt><dd>1인 {rules.dailyLimitPerMember}장</dd>
              <dt>쿠폰 유효기간</dt><dd>발급일부터 {rules.couponValidDays}일</dd>
              <dt>사용 방법</dt><dd>주문 시 직원에게 쿠폰 화면 제시 후 [사용 처리]</dd>
              <dt>제외</dt><dd>영수증을 받은 매장에서는 사용할 수 없습니다. 주문서(빌지)·재출력·화면 촬영 사진은 인정되지 않습니다.</dd>
            </dl>
            <div className={styles.guideActions}>
              <Link href="/guide" className="btn btn-outline">이용 안내 전체 보기</Link>
              <Link href="/verify" className="btn btn-red">영수증 인증</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
