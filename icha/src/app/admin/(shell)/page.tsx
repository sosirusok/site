import Link from "next/link";
import { one, query } from "@/lib/db";
import { kstDayStart } from "@/lib/db/queries";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { fmtDateTime } from "@/components/admin/format";
import { StoreTag } from "@/components/admin/StoreTag";
import ui from "@/app/admin/admin.module.css";
import s from "./dashboard.module.css";

export const metadata = { title: "대시보드" };

/** 오늘(KST) 카운터에서 준 쿠폰 수·사용 처리 수(매장별)와 회원 수만 본다. */
export default async function AdminDashboard() {
  await requireAdminPage();
  const now = new Date();
  const dayStart = kstDayStart(now).toISOString();
  const [issued, used, members] = await Promise.all([
    query<{ store_id: string; n: number }>(`select store_id, count(*)::int as n from receipts where status='approved' and 'COUNTER' = any(reasons) and created_at >= $1 group by store_id`, [dayStart]),
    query<{ store_id: string; n: number }>(`select use_store_id as store_id, count(*)::int as n from coupons where status='used' and used_at >= $1 group by use_store_id`, [dayStart]),
    one<{ n: number }>(`select count(*)::int as n from members`),
  ]);
  const issuedBy = (id: string) => Number(issued.find((r) => r.store_id === id)?.n ?? 0);
  const usedBy = (id: string) => Number(used.find((r) => r.store_id === id)?.n ?? 0);
  const issuedTotal = issued.reduce((a, r) => a + Number(r.n), 0);
  const usedTotal = used.reduce((a, r) => a + Number(r.n), 0);

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>오늘</h1>
          <p className={ui.pageDesc}>{fmtDateTime(now)} 기준 · 한국 시간 0시부터</p>
        </div>
        <div className={ui.pageActions}>
          <Link href="/admin/counter" className={`${ui.button} ${ui.buttonLg}`}>
            카운터 열기
          </Link>
        </div>
      </div>

      <div className={s.stats}>
        <div className={s.stat}>
          <span className={s.statLabel}>오늘 쿠폰 주기</span>
          <span className={s.statValue}>{issuedTotal}</span>
          <span className={s.statSub}>카운터에서 번호로 넣은 수</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>오늘 사용 처리</span>
          <span className={s.statValue}>{usedTotal}</span>
          <span className={s.statSub}>혜택이 나간 수</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>회원</span>
          <span className={s.statValue}>{Number(members?.n ?? 0).toLocaleString("ko-KR")}</span>
          <span className={s.statSub}>번호가 등록된 손님</span>
        </div>
      </div>

      <section className={ui.panel} style={{ marginTop: 16 }}>
        <div className={ui.panelHead}>
          <h2 className={ui.panelTitle}>매장별 오늘</h2>
          <span className={ui.panelNote}>쿠폰 주기는 계산한 매장, 사용 처리는 혜택이 나간 매장 기준</span>
        </div>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>매장</th>
                <th className={ui.right}>쿠폰 주기</th>
                <th className={ui.right}>사용 처리</th>
              </tr>
            </thead>
            <tbody>
              {STORES.map((st) => (
                <tr key={st.id}>
                  <td>
                    <StoreTag id={st.id} full />
                  </td>
                  <td className={ui.num}>{issuedBy(st.id)}건</td>
                  <td className={ui.num}>{usedBy(st.id)}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
