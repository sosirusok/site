import Link from "next/link";
import { STORE_IDS, type StoreId } from "@/lib/config";
import { STORES, getStore } from "@/lib/stores";
import { adminView } from "@/lib/tabletalk/service";
import { getTTSettings } from "@/lib/tabletalk/settings";
import { budget, currentPace, usageNow } from "@/lib/tabletalk/usage";
import { requireAdminPage } from "@/components/admin/guard";
import { TableTalkAdmin } from "@/components/admin/TableTalkAdmin";
import ui from "@/app/admin/admin.module.css";
import ps from "../poster/poster.module.css";

export const metadata = { title: "테이블톡" };
export const dynamic = "force-dynamic";

/** 테이블톡 — 가게 안 테이블끼리 대화. 직원은 자기 매장, 총괄은 매장을 골라 본다 */
export default async function TableTalkAdminPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const session = await requireAdminPage();
  const owner = session.role === "owner";
  const sp = await searchParams;
  const want = (sp.store ?? "") as StoreId;
  const store: StoreId = !owner && session.storeId ? (session.storeId as StoreId) : STORE_IDS.includes(want) ? want : STORES[0]!.id;
  const [view, settings] = await Promise.all([adminView(store), getTTSettings(true)]);
  const usage = owner ? await Promise.all([usageNow(), currentPace()]).then(([u, p]) => ({ ...u, budget: budget(), pace: p.pace, closed: p.closed })) : null;

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>테이블톡</h1>
          <p className={ui.pageDesc}>테이블 QR 을 찍은 손님끼리 테이블 대 테이블로 대화합니다. 로그인·쿠폰과는 따로 돕니다.</p>
        </div>
        <div className={ui.pageActions}>
          <Link href={`/admin/poster?type=table&store=${store}`} className={`${ui.button} ${ui.buttonGhost}`}>
            테이블 QR 인쇄
          </Link>
        </div>
      </div>
      {owner && (
        <div className={ps.typeTabs} role="tablist" aria-label="매장">
          {STORES.map((st) => (
            <Link key={st.id} href={`/admin/tabletalk?store=${st.id}`} className={`${ps.typeTab} ${st.id === store ? ps.typeTabActive : ""}`} role="tab" aria-selected={st.id === store}>
              {st.shortName}
            </Link>
          ))}
        </div>
      )}
      {/* 매장 탭은 같은 페이지 안 이동이라 폼이 그대로 남는다 — 매장마다 새로 그려 다른 매장 설정이 섞여 저장되지 않게 */}
      <TableTalkAdmin
        key={store}
        store={store}
        storeName={getStore(store)?.shortName ?? store}
        seats={view.seats}
        locks={view.locks}
        reports={view.reports}
        settings={settings[store]}
        owner={owner}
        usage={usage}
      />
    </>
  );
}
