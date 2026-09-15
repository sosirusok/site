import Link from "next/link";
import { BRAND } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { ArrowIcon } from "@/components/ui/icons";
import { HomeHero } from "@/components/site/HomeHero";
import { HomeNotice } from "@/components/site/HomeNotice";
import { HomeSteps } from "@/components/site/HomeSteps";
import { HomeStores } from "@/components/site/HomeStores";
import { HomeTiers } from "@/components/site/HomeTiers";
import { Marquee } from "@/components/site/Marquee";
import { SectionHead } from "@/components/site/HomeSectionHead";
import { SeomyeonMap, placedStores } from "@/components/site/SeomyeonMap";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rules = await getRules();
  const mapStores = placedStores();

  return (
    <>
      <HomeNotice text={rules.notice} />
      <HomeHero rules={rules} />
      <Marquee />

      <section className={`wrap ${styles.section}`} aria-labelledby="steps-title">
        <SectionHead id="steps-title" num="이용 순서" title="세 단계면 끝이에요" sub="사진 한 장이면 돼요. 회원 가입도, 인증번호도 없어요." />
        <HomeSteps rules={rules} />
      </section>

      <section className={`wrap ${styles.section}`} aria-labelledby="stores-title">
        <span id="stores" className={styles.anchor} aria-hidden="true" />
        <SectionHead id="stores-title" num="서면" title="세 매장" sub="영수증을 받은 곳 말고, 나머지 두 곳에서 사이드를 드려요." />
        <HomeStores />
      </section>

      {mapStores && (
        <section className={`wrap ${styles.section}`} aria-labelledby="map-title">
          <SectionHead id="map-title" num="약도" title="서면역에서 걸어서" sub="세 곳 모두 서면역 근처 골목에 있어요. 1차에서 2차로 옮기기 좋게." />
          <div className="rise rise-d1">
            <SeomyeonMap />
          </div>
        </section>
      )}

      <section className={`wrap ${styles.section}`} aria-labelledby="tier-title">
        <SectionHead id="tier-title" num="등급" title="자주 오시면 등급이 올라요" />
        <HomeTiers rules={rules} />
      </section>

      <section className={`wrap ${styles.cta} rise`} aria-labelledby="cta-title">
        <hr className="rule-thick" />
        <div className={styles.ctaGrid}>
          <h2 id="cta-title" className={`serif ${styles.ctaTitle}`}>
            영수증,<br />아직 버리지 마세요.
          </h2>
          <div className={styles.ctaBody}>
            <p className={styles.ctaText}>{BRAND.tagline}</p>
            <div className={styles.ctaActions}>
              <Link href="/verify" className="btn btn-lg">영수증 인증하기 <ArrowIcon size={20} /></Link>
              <Link href="/guide" className={styles.ctaLink}>이용 방법과 유의사항</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
