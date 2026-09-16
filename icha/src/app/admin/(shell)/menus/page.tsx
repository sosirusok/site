import Link from "next/link";
import { listMenu } from "@/lib/db/queries";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { MenuManager } from "@/components/admin/MenuManager";
import ui from "@/app/admin/admin.module.css";
import s from "./menus.module.css";

export const metadata = { title: "메뉴" };

export default async function MenusPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="메뉴 편집" />;
  const sp = await searchParams;
  const store = STORES.find((x) => x.id === sp.store) ?? STORES[0]!;
  const all = await Promise.all(STORES.map(async (st) => ({ id: st.id, items: await listMenu(st.id, { includeInactive: true }) })));
  const items = all.find((a) => a.id === store.id)?.items ?? [];

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>메뉴</h1>
          <p className={ui.pageDesc}>"무료 증정"으로 표시한 메뉴만 손님이 쿠폰으로 고를 수 있습니다. 매장당 그 집 술 한 잔(막걸리·생맥주·소주) 1개가 기본이고, 늘려도 됩니다.</p>
        </div>
      </div>
      <div className={s.tabs} role="tablist" aria-label="매장">
        {STORES.map((st) => {
          const n = all.find((a) => a.id === st.id)?.items ?? [];
          return (
            <Link key={st.id} href={`/admin/menus?store=${st.id}`} data-store={st.id} className={`${s.tab} ${st.id === store.id ? s.tabActive : ""}`} role="tab" aria-selected={st.id === store.id}>
              <span className={ui.storeDot} aria-hidden="true" />
              {st.shortName}
              <span className={s.tabCount}>
                {n.filter((m) => m.isGift && m.active).length}/{n.length}
              </span>
            </Link>
          );
        })}
      </div>
      <MenuManager key={store.id} storeId={store.id} storeName={store.shortName} items={items} />
    </>
  );
}
