import type { Metadata } from "next";
import Link from "next/link";
import { Counter } from "@/components/home/Counter";
import { Steps } from "@/components/home/Steps";
import { Stores } from "@/components/home/Stores";
import { Gifts } from "@/components/home/Gifts";
import { MapSection } from "@/components/home/MapSection";
import { Vip } from "@/components/home/Vip";
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
  return (
    <div className={styles.col}>
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}
      {!rules.eventActive && <p className={styles.notice}>지금은 이벤트를 잠시 쉬고 있어요.</p>}
      <Counter />
      <Steps rules={rules} />
      <Stores />
      <Gifts gifts={gifts} />
      <MapSection />
      <Vip rules={rules} />
      <p className={`wrap ${styles.more}`}>
        <Link href="/guide">자세한 규칙은 이용 안내에서 →</Link>
      </p>
    </div>
  );
}
