import { listAdmins } from "@/lib/db/queries";
import { STORES, getStore } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { fmtDate } from "@/components/admin/format";
import { StaffCreateForm, StaffTable } from "@/components/admin/StaffTable";
import ui from "@/app/admin/admin.module.css";
import s from "./staff.module.css";

export const metadata = { title: "직원 계정" };

export default async function StaffPage() {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="직원 계정 관리" />;
  const admins = await listAdmins();
  const rows = admins.map((a) => ({ id: a.id, name: a.name, storeId: a.storeId, storeName: a.storeId ? getStore(a.storeId)?.shortName ?? a.storeId : null, role: a.role, active: a.active, createdAt: fmtDate(a.createdAt) }));
  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>직원 계정</h1>
          <p className={ui.pageDesc}>매장마다 계정 하나를 만들어 태블릿에 로그인해 두면 됩니다. 그만둔 직원 계정은 비활성화합니다.</p>
        </div>
      </div>
      <div className={s.grid}>
        <StaffTable admins={rows} meId={session.adminId} />
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>계정 추가</h2>
          </div>
          <div className={ui.panelBody}>
            <StaffCreateForm stores={STORES.map((st) => ({ id: st.id, shortName: st.shortName }))} />
          </div>
        </section>
      </div>
    </>
  );
}
