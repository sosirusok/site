import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPhone, reasonText } from "@/lib/config";
import { getMember, listCouponsForMember, listMenu, listReceiptsForMember } from "@/lib/db/queries";
import { getRules, tierFor } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { COUPON_KIND, fmtDateTime, fmtShort, won } from "@/components/admin/format";
import { CouponBadge, ReceiptBadge } from "@/components/admin/Badge";
import { StoreTag } from "@/components/admin/StoreTag";
import { MemberMemoForm } from "@/components/admin/MemberMemoForm";
import { IssueCouponForm } from "@/components/admin/IssueCouponForm";
import ui from "@/app/admin/admin.module.css";
import s from "../members.module.css";

export const metadata = { title: "회원 상세" };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="회원 상세" />;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const m = await getMember(id);
  if (!m) notFound();
  const [rules, receipts, coupons] = await Promise.all([getRules(), listReceiptsForMember(m.id, 100), listCouponsForMember(m.id)]);
  const tier = tierFor(m.totalSpend, rules);
  const now = new Date();
  const nextTier = tier.next;
  const prevMin = rules.tiers.find((t) => t.key === tier.key)?.minSpend ?? 0;
  const progress = nextTier ? Math.min(100, Math.round(((m.totalSpend - prevMin) / Math.max(1, prevMin + nextTier.remaining - prevMin)) * 100)) : 100;
  const gifts = Object.fromEntries(await Promise.all(STORES.map(async (st) => [st.id, (await listMenu(st.id, { giftOnly: true })).map((g) => ({ id: g.id, name: g.name, price: g.price }))])));

  return (
    <>
      <p className={ui.crumb}>
        <Link href="/admin/members">회원</Link> / <span className={ui.mono}>{formatPhone(m.phone)}</span>
      </p>
      <div className={s.head}>
        <section className={`${ui.panel} ${ui.panelBody}`}>
          <div className={s.bigPhone}>{formatPhone(m.phone)}</div>
          <p className={ui.help}>
            가입 {fmtDateTime(m.createdAt)} · 최근 로그인 {fmtDateTime(m.lastLoginAt)}
          </p>
          <div className={s.facts}>
            <div className={s.fact}>
              <span className={s.factLabel}>등급</span>
              <span className={s.factValue} style={{ fontFamily: "inherit" }}>
                {tier.name}
              </span>
              {m.tier !== tier.key ? <span className={`${ui.help}`}>저장된 등급({m.tier})과 다름 — 설정에서 재계산</span> : null}
            </div>
            <div className={s.fact}>
              <span className={s.factLabel}>누적 결제</span>
              <span className={s.factValue}>{won(m.totalSpend)}</span>
            </div>
            <div className={s.fact}>
              <span className={s.factLabel}>방문(승인)</span>
              <span className={s.factValue}>{m.visitCount}회</span>
            </div>
            <div className={s.fact}>
              <span className={s.factLabel}>{nextTier ? `${nextTier.name}까지` : "최고 등급"}</span>
              <span className={s.factValue}>{nextTier ? won(nextTier.remaining) : "—"}</span>
              <div className={s.tierBar}>
                <div className={s.tierFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </section>
        <section className={`${ui.panel} ${ui.panelBody}`}>
          <MemberMemoForm memberId={m.id} memo={m.memo} />
        </section>
      </div>

      <div className={ui.grid2} style={{ marginTop: 16 }}>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>영수증 {receipts.length}건</h2>
          </div>
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>접수</th>
                  <th>상태</th>
                  <th>매장</th>
                  <th className={ui.right}>금액</th>
                  <th>사유</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={ui.empty}>
                      아직 올린 영수증이 없습니다.
                    </td>
                  </tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id}>
                      <td className={ui.nowrap}>
                        <Link href={`/admin/receipts/${r.id}`} className={`${ui.rowLink} ${ui.mono}`}>
                          {fmtShort(r.createdAt, now)}
                        </Link>
                      </td>
                      <td>
                        <ReceiptBadge status={r.status} />
                      </td>
                      <td>
                        <StoreTag id={r.storeId} />
                      </td>
                      <td className={ui.num}>{won(r.amount)}</td>
                      <td className={ui.dim}>{r.reasons.slice(0, 1).map(reasonText).join("") || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>쿠폰 {coupons.length}장</h2>
          </div>
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>코드</th>
                  <th>상태</th>
                  <th>매장 · 메뉴</th>
                  <th>종류</th>
                  <th>만료</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={ui.empty}>
                      발급된 쿠폰이 없습니다.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/coupons?code=${c.code}`} className={`${ui.rowLink} ${ui.mono}`}>
                          {c.code}
                        </Link>
                      </td>
                      <td>
                        <CouponBadge status={c.status} />
                      </td>
                      <td>
                        <StoreTag id={c.useStoreId} /> {c.menuName}
                      </td>
                      <td className={ui.dim}>{COUPON_KIND[c.kind] ?? c.kind}</td>
                      <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(c.expiresAt, now)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className={ui.panel} style={{ marginTop: 16 }}>
        <div className={ui.panelHead}>
          <h2 className={ui.panelTitle}>이 회원에게 쿠폰 발급</h2>
          <span className={ui.panelNote}>사과·감사·이벤트 등 이유는 메모에</span>
        </div>
        <div className={ui.panelBody}>
          <IssueCouponForm mode="member" memberId={m.id} stores={STORES.map((st) => ({ id: st.id, shortName: st.shortName }))} gifts={gifts} tiers={rules.tiers} defaultDays={rules.couponValidDays} />
        </div>
      </section>
    </>
  );
}
