import type { Metadata } from "next";
import Link from "next/link";
import { Poster } from "@/components/home/Poster";
import { Benefit } from "@/components/home/Benefit";
import { HowTo } from "@/components/home/HowTo";
import { StoreList } from "@/components/home/StoreList";
import { GiftList } from "@/components/home/GiftList";
import { Directions } from "@/components/home/Directions";
import { Tier } from "@/components/home/Tier";
import { StickyCta } from "@/components/site/StickyCta";
import { Chevron } from "@/components/ui/Chevron";
import { listMenu, type MenuItem } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { BRAND } from "@/lib/config";
import styles from "./page.module.css";

export const metadata: Metadata = { title: `${BRAND.name} — ${BRAND.unionName}`, description: BRAND.tagline };

/** 홈 — 포스터 → 혜택 카드 → 받는 순서 → 1차·2차·3차 → 매장별 혜택 → 오시는 길 → 단골 등급 → 이용 안내. 아래 고정 버튼이 여백을 준다(.app:has(.sticky-cta)). */
export default async function HomePage() {
  const rules = await getRules();
  const gifts: Record<string, MenuItem[]> = {};
  await Promise.all(STORES.map(async (s) => { gifts[s.id] = await listMenu(s.id, { giftOnly: true }); }));
  const now = new Date();
  return (
    <>
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}
      {!rules.eventActive && <p className={styles.notice}>지금은 이벤트를 잠시 쉬고 있어요.</p>}
      <Poster />
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
      <div className="wrap">
        <Link href="/guide" className={`row ${styles.guide}`}>
          <span className="body"><span className="title">이용 안내</span></span>
          <Chevron />
        </Link>
      </div>
      <p className={`wrap cap ${styles.slogan}`}>{BRAND.slogan}</p>
      <StickyCta href="/verify">영수증 인증하기</StickyCta>
    </>
  );
}
