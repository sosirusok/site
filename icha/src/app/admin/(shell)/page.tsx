import Link from "next/link";
import { dashboardStats } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { fmtDateTime, tierName, won } from "@/components/admin/format";
import { StoreTag } from "@/components/admin/StoreTag";
import ui from "@/app/admin/admin.module.css";
import s from "./dashboard.module.css";

export const metadata = { title: "대시보드" };

export default async function AdminDashboard() {
  await requireAdminPage();
  const now = new Date();
  const [stats, rules] = await Promise.all([dashboardStats(now), getRules()]);
  const t = stats.today;
  const maxDay = Math.max(1, ...stats.recentDays.map((d) => Math.max(d.receipts, d.used)));
  const tierTotal = stats.tiers.reduce((a, b) => a + b.n, 0);
  const tierOrder = ["none", ...rules.tiers.map((x) => x.key)];
  const tiersSorted = [...stats.tiers].sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>대시보드</h1>
          <p className={ui.pageDesc}>{fmtDateTime(now)} 기준 · 오늘은 한국 시간 0시부터</p>
        </div>
        <div className={ui.pageActions}>
          <Link href="/admin/coupons" className={`${ui.button} ${ui.buttonGhost}`}>
            쿠폰 코드 조회
          </Link>
          <Link href="/admin/receipts?status=review" className={ui.button}>
            확인 대기 처리
          </Link>
        </div>
      </div>

      <div className={s.stats}>
        <Link href="/admin/receipts?status=review" className={`${s.stat} ${s.pending} ${stats.pendingReview === 0 ? s.pendingZero : ""}`}>
          <span className={s.statLabel}>직원 확인 대기</span>
          <span className={s.statValue}>{stats.pendingReview}</span>
          <span className={s.statSub}>{stats.pendingReview === 0 ? "밀린 건이 없습니다" : "누르면 대기 목록으로"}</span>
        </Link>
        <div className={s.stat}>
          <span className={s.statLabel}>오늘 접수</span>
          <span className={s.statValue}>{t.receipts}</span>
          <span className={s.statSub}>
            승인 <b>{t.approved}</b> · 대기 <b>{t.review}</b> · 반려 <b>{t.rejected}</b>
          </span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>오늘 쿠폰</span>
          <span className={s.statValue}>{t.couponsIssued}</span>
          <span className={s.statSub}>
            발급 · 사용 <b>{t.couponsUsed}</b>
          </span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>사용 가능 쿠폰</span>
          <span className={s.statValue}>{stats.activeCoupons}</span>
          <span className={s.statSub}>아직 안 쓴 전체 쿠폰</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>회원</span>
          <span className={s.statValue}>{stats.members.toLocaleString("ko-KR")}</span>
          <span className={s.statSub}>번호로 한 번이라도 로그인</span>
        </div>
      </div>

      <div className={ui.grid2} style={{ marginTop: 16 }}>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>최근 14일</h2>
            <div className={s.legend}>
              <span>영수증 접수</span>
              <span className={s.legendUsed}>쿠폰 사용</span>
            </div>
          </div>
          <div className={ui.panelBody}>
            <div className={s.chart} role="img" aria-label="최근 14일 영수증 접수와 쿠폰 사용 건수">
              {stats.recentDays.map((d, i) => (
                <div key={d.day} className={`${s.col} ${i === stats.recentDays.length - 1 ? s.colToday : ""}`} title={`${d.day} · 접수 ${d.receipts}건 · 사용 ${d.used}건`}>
                  <div className={s.bars}>
                    <div className={s.bar} style={{ height: `${Math.round((d.receipts / maxDay) * 100)}%` }} />
                    <div className={`${s.bar} ${s.barUsed}`} style={{ height: `${Math.round((d.used / maxDay) * 100)}%` }} />
                  </div>
                  <div className={s.colLabel}>{d.day.slice(3)}</div>
                </div>
              ))}
            </div>
            <p className={ui.help} style={{ marginTop: 8 }}>
              날짜는 일(日)만 표시. 마지막 칸이 오늘. 14일 합계 접수 {stats.recentDays.reduce((a, b) => a + b.receipts, 0)}건 · 사용 {stats.recentDays.reduce((a, b) => a + b.used, 0)}건.
            </p>
          </div>
        </section>

        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>등급 분포</h2>
            <span className={ui.panelNote}>누적 결제 금액 기준</span>
          </div>
          <div className={ui.panelBody}>
            {tierTotal === 0 ? (
              <p className={ui.empty}>아직 회원이 없습니다.</p>
            ) : (
              <div className={s.tiers}>
                {tiersSorted.map((row) => (
                  <div key={row.tier} className={s.tierRow}>
                    <span>{tierName(row.tier, rules.tiers)}</span>
                    <div className={s.tierBar}>
                      <div className={s.tierFill} style={{ width: `${Math.max(1, Math.round((row.n / tierTotal) * 100))}%` }} />
                    </div>
                    <span className={s.tierN}>{row.n.toLocaleString("ko-KR")}명</span>
                  </div>
                ))}
              </div>
            )}
            <dl className={ui.kv} style={{ marginTop: 14 }}>
              {rules.tiers.map((tr) => (
                <div key={tr.key} style={{ display: "contents" }}>
                  <dt>{tr.name}</dt>
                  <dd className={ui.mono}>{won(tr.minSpend)} 이상</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>

      <section className={ui.panel} style={{ marginTop: 16 }}>
        <div className={ui.panelHead}>
          <h2 className={ui.panelTitle}>매장별 최근 30일</h2>
          <span className={ui.panelNote}>영수증은 접수 매장, 쿠폰 사용은 사용 매장 기준</span>
        </div>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>매장</th>
                <th className={ui.right}>승인 영수증</th>
                <th className={ui.right}>누적 결제 금액</th>
                <th className={ui.right}>쿠폰 사용</th>
              </tr>
            </thead>
            <tbody>
              {STORES.map((st) => {
                const row = stats.byStore.find((b) => b.storeId === st.id);
                return (
                  <tr key={st.id}>
                    <td>
                      <StoreTag id={st.id} full />
                    </td>
                    <td className={ui.num}>{row?.receipts30d ?? 0}건</td>
                    <td className={ui.num}>{won(row?.spend30d ?? 0)}</td>
                    <td className={ui.num}>{row?.couponsUsed30d ?? 0}건</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
