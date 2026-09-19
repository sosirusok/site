import type { Metadata } from "next";
import { Directions } from "@/components/home/Directions";
import { FaqTeaser } from "@/components/home/FaqTeaser";
import { Hero, HeroMarquee } from "@/components/home/Hero";
import { HowToSteps } from "@/components/home/HowToSteps";
import { StoreCards } from "@/components/home/StoreCards";
import { BRAND, STORE_IDS, type StoreId } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import styles from "./page.module.css";

export const metadata: Metadata = { description: BRAND.tagline };

/** 정적(ISR) — 60초마다 뒤에서 새로 만든다. 관리자가 규칙·메뉴·공지를 저장하면 revalidatePath("/") 로 바로. */
export const revalidate = 60;

/** 매장별 혜택 품목 이름(관리자가 메뉴에서 '혜택'으로 켠 것). DB 가 없으면 빈 배열 → 포스터 혜택 이름으로 대신 쓴다 */
async function giftNames(): Promise<Record<StoreId, string[]>> {
  const lists = await Promise.all(STORE_IDS.map((id) => listMenu(id, { giftOnly: true }).catch(() => [])));
  return Object.fromEntries(STORE_IDS.map((id, i) => [id, (lists[i] ?? []).map((m) => m.name)])) as Record<StoreId, string[]>;
}

/**
 * 홈 — 포스터 히어로 → (공지) → 참여 매장 3곳(카드) → 이용 방법 → 오시는 길(지도) → 자주 묻는 질문 → 푸터.
 * 아래 고정 버튼은 없다(탭에 쿠폰함·예약이 있다).
 */
export default async function HomePage() {
  const [rules, gifts] = await Promise.all([getRules(), giftNames()]);
  const now = new Date();
  return (
    <>
      <Hero rules={rules} />
      <HeroMarquee />
      {(rules.notice || !rules.eventActive) && (
        <p className={styles.notice}><b className={styles.noticeTag}>공지</b>{rules.notice || "이벤트 기간이 아닙니다"}</p>
      )}
      <StoreCards now={now} rules={rules} gifts={gifts} />
      <HowToSteps rules={rules} />
      <Directions />
      <FaqTeaser rules={rules} />
    </>
  );
}
