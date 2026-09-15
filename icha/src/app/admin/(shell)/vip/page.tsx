import Link from "next/link";
import { listCoupons, listMembers, listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { fmtShort, tierName } from "@/components/admin/format";
import { IssueCouponForm } from "@/components/admin/IssueCouponForm";
import { StoreTag } from "@/components/admin/StoreTag";
import ui from "@/app/admin/admin.module.css";

export const metadata = { title: "등급 쿠폰 발급" };

export default async function VipPage() {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="쿠폰 일괄 발급" />;
  const rules = await getRules();
  const gifts = Object.fromEntries(await Promise.all(STORES.map(async (st) => [st.id, (await listMenu(st.id, { giftOnly: true })).map((g) => ({ id: g.id, name: g.name, price: g.price }))])));
  const counts = await Promise.all(rules.tiers.map(async (t) => ({ ...t, n: (await listMembers({ tier: t.key, limit: 1 })).total })));
  const recent = (await listCoupons({ limit: 12 })).items.filter((c) => c.kind !== "side");
  const now = new Date();

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>등급별 · 개인 쿠폰 발급</h1>
          <p className={ui.pageDesc}>영수증 없이 관리자가 직접 주는 쿠폰입니다. 등급 전체에 뿌리거나 한 명에게만 줄 수 있습니다.</p>
        </div>
      </div>
      <div className={ui.grid2}>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>발급</h2>
          </div>
          <div className={ui.panelBody}>
            <IssueCouponForm mode="bulk" stores={STORES.map((st) => ({ id: st.id, shortName: st.shortName }))} gifts={gifts} tiers={rules.tiers} defaultDays={rules.couponValidDays} />
          </div>
        </section>
        <div className={ui.stack}>
          <section className={ui.panel}>
            <div className={ui.panelHead}>
              <h2 className={ui.panelTitle}>등급별 인원</h2>
              <Link href="/admin/settings" className={ui.linkButton}>
                기준 바꾸기
              </Link>
            </div>
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>등급</th>
                    <th className={ui.right}>기준 금액</th>
                    <th className={ui.right}>회원</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map((t) => (
                    <tr key={t.key}>
                      <td>{t.name}</td>
                      <td className={ui.num}>{t.minSpend.toLocaleString("ko-KR")}원 이상</td>
                      <td className={ui.num}>{t.n}명</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className={ui.panel}>
            <div className={ui.panelHead}>
              <h2 className={ui.panelTitle}>최근 수동 발급</h2>
            </div>
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>발급</th>
                    <th>매장 · 메뉴</th>
                    <th>종류</th>
                    <th>메모</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={ui.empty}>
                        아직 수동 발급한 쿠폰이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    recent.map((c) => (
                      <tr key={c.id}>
                        <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(c.issuedAt, now)}</td>
                        <td>
                          <StoreTag id={c.useStoreId} /> {c.menuName}
                        </td>
                        <td className={ui.dim}>{c.kind === "vip" ? `등급 혜택` : "수동"}</td>
                        <td className={ui.dim}>{c.note ?? ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <p className={ui.help}>
            현재 등급 이름: {rules.tiers.map((t) => tierName(t.key, rules.tiers)).join(" · ")}. 등급 혜택 쿠폰은 회원 쿠폰함에 "등급 혜택"으로 표시됩니다.
          </p>
        </div>
      </div>
    </>
  );
}
