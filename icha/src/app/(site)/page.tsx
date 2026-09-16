import type { Metadata } from "next";
import Link from "next/link";
import { NightHero } from "@/components/home/NightHero";
import { Ticker } from "@/components/home/Ticker";
import { StorePanels } from "@/components/home/StorePanels";
import { HowTo } from "@/components/home/HowTo";
import { AfterVisit } from "@/components/home/AfterVisit";
import { Directions } from "@/components/home/Directions";
import { PlaceButton } from "@/components/site/PlaceButton";
import { ShareButton } from "@/components/site/ShareButton";
import { StickyCta } from "@/components/site/StickyCta";
import { Chevron } from "@/components/ui/Chevron";
import { listMenu, type MenuItem } from "@/lib/db/queries";
import { placeSheetStores } from "@/lib/place-stores";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { BRAND, SITE_URL } from "@/lib/config";
import styles from "./page.module.css";

export const metadata: Metadata = { title: `${BRAND.name} — ${BRAND.unionName}`, description: BRAND.tagline };

/** 홈 — 첫 장면(밤 사진) → 이름 띠 → 1차·2차·3차 사진 → 이렇게 받아요 → 다녀온 뒤에 → 오시는 길 → 안내. 아래 고정 버튼은 예약 시트. */
export default async function HomePage() {
  const rules = await getRules();
  const gifts: Record<string, MenuItem[]> = {};
  await Promise.all(STORES.map(async (s) => { gifts[s.id] = await listMenu(s.id, { giftOnly: true }).catch(() => []); }));
  const now = new Date();
  return (
    <>
      <NightHero />
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}
      {!rules.eventActive && <p className={styles.notice}>지금은 이벤트를 잠시 쉬고 있어요.</p>}
      <Ticker />
      <StorePanels now={now} gifts={gifts} rules={rules} />
      <HowTo rules={rules} />
      <AfterVisit rules={rules} />
      <Directions />
      <p className={styles.slogan}>{BRAND.slogan}</p>
      <div className={`wrap ${styles.tail}`}>
        <Link href="/guide" className="row">
          <span className="body"><span className="title">이용 안내</span></span>
          <Chevron />
        </Link>
        <ShareButton title={BRAND.name} text={BRAND.tagline} url={SITE_URL} variant="row" className="row" />
      </div>
      <StickyCta>
        <PlaceButton stores={placeSheetStores()} className="btn btn-naver btn-block">예약하기</PlaceButton>
      </StickyCta>
    </>
  );
}
