import type { Metadata } from "next";
import Link from "next/link";
import { PhotoStrip } from "@/components/home/PhotoStrip";
import { Benefit } from "@/components/home/Benefit";
import { HowTo } from "@/components/home/HowTo";
import { StoreList } from "@/components/home/StoreList";
import { GiftList } from "@/components/home/GiftList";
import { Directions } from "@/components/home/Directions";
import { Tier } from "@/components/home/Tier";
import { StickyCta } from "@/components/site/StickyCta";
import { listMenu, type MenuItem } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { BRAND } from "@/lib/config";
import styles from "./page.module.css";

export const metadata: Metadata = { title: `${BRAND.name} — ${BRAND.unionName}`, description: BRAND.tagline };

export default async function HomePage() {
  const rules = await getRules();
  const gifts: Record<string, MenuItem[]> = {};
  await Promise.all(STORES.map(async (s) => { gifts[s.id] = await listMenu(s.id, { giftOnly: true }); }));
  const now = new Date();
  return (
    <div className="has-sticky">
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}
      {!rules.eventActive && <p className={styles.notice}>지금은 이벤트를 잠시 쉬고 있어요.</p>}
      <PhotoStrip />
      <Benefit />
      <div className="band" />
      <HowTo rules={rules} />
      <div className="band" />
      <StoreList now={now} />
      <div className="band" />
      <GiftList gifts={gifts} />
      <div className="band" />
      <Directions />
      <div className="band" />
      <Tier rules={rules} />
      <p className={`wrap ${styles.guide}`}>
        <Link href="/guide" className="btn-text">이용 안내 보기</Link>
      </p>
      <StickyCta href="/verify">영수증 인증하기</StickyCta>
    </div>
  );
}
