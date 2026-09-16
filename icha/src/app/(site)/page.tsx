import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Directions } from "@/components/home/Directions";
import { HowTo } from "@/components/home/HowTo";
import { Marquee } from "@/components/home/Marquee";
import { PosterHero } from "@/components/home/PosterHero";
import { StoreBlocks } from "@/components/home/StoreBlocks";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND, STORE_IDS, type StoreId } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import styles from "./page.module.css";

export const metadata: Metadata = { description: BRAND.tagline };

/** 가게별 혜택 품목 이름(관리자가 메뉴에서 '혜택'으로 켠 것). DB 가 없으면 빈 배열 → 포스터 혜택 이름으로 대신 쓴다 */
async function giftNames(): Promise<Record<StoreId, string[]>> {
  const lists = await Promise.all(STORE_IDS.map((id) => listMenu(id, { giftOnly: true }).catch(() => [])));
  return Object.fromEntries(STORE_IDS.map((id, i) => [id, (lists[i] ?? []).map((m) => m.name)])) as Record<StoreId, string[]>;
}

/**
 * 홈 — 사장님 포스터를 아래로 이어 붙인 콜라주.
 * 포스터 머리 → 검은 띠 → 1차·2차·3차(간판·폴라로이드·혜택·예약하기) → 영수증 릴레이 EVENT(리본·순서·메모·조건) → 오시는 길 → 포스터 마지막 줄.
 * 아래 고정 버튼은 없다(탭에 쿠폰함·플레이스가 있다).
 */
export default async function HomePage() {
  const [rules, session, gifts] = await Promise.all([getRules(), getMemberSession(), giftNames()]);
  const now = new Date();
  return (
    <>
      <PosterHero />
      {(rules.notice || !rules.eventActive) && (
        <div className={`scrap ${styles.notice}`} style={{ "--r": "1deg" } as CSSProperties}>
          <p className={`scrap-in hand ${styles.noticeIn}`}>{rules.notice || "지금은 이벤트를 잠시 쉬고 있어요."}</p>
        </div>
      )}
      <Marquee />
      <StoreBlocks now={now} rules={rules} gifts={gifts} />
      <HowTo rules={rules} loggedIn={Boolean(session)} />
      <Directions />
    </>
  );
}
