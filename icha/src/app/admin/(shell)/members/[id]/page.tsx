import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPhone } from "@/lib/config";
import { isPickExpired } from "@/lib/coupons";
import { getMember, listCouponsForMember, listMenu, listReceiptsForMember } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { COUPON_KIND, fmtDateTime, fmtShort, won } from "@/components/admin/format";
import { Badge, CouponBadge } from "@/components/admin/Badge";
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
  const now = new Date();
  const gifts = Object.fromEntries(await Promise.all(STORES.map(async (st) => [st.id, (await listMenu(st.id, { giftOnly: true })).map((g) => ({ id: g.id, name: g.name, price: g.price }))])));
  const couponByReceipt = new Map(coupons.filter((c) => c.receiptId).map((c) => [c.receiptId!, c]));
  // 사진 인증 시절 데이터가 남아 있어도 릴레이 표에는 승인 건만 보인다
  const relays = receipts.filter((r) => r.status === "approved");

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
              <span className={s.factLabel}>릴레이</span>
              <span className={s.factValue}>{m.visitCount}회</span>
            </div>
            <div className={s.fact}>
              <span className={s.factLabel}>쿠폰</span>
              <span className={s.factValue}>{coupons.length}장</span>
            </div>
            <div className={s.fact}>
              <span className={s.factLabel}>누적 금액 (입력분)</span>
              <span className={s.factValue}>{m.totalSpend > 0 ? won(m.totalSpend) : "-"}</span>
            </div>
            <div className={s.fact}>
              <span className={s.factLabel}>성인 확인</span>
              <span className={s.factValue}>{m.adultVerifiedAt ? fmtDateTime(m.adultVerifiedAt) : "안 함"}</span>
            </div>
          </div>
          <p style={{ marginTop: 12 }}>
            <Link href={`/admin/counter?phone=${m.phone}`} className={`${ui.button} ${ui.buttonGhost}`}>
              카운터에서 열기
            </Link>
          </p>
        </section>
        <section className={`${ui.panel} ${ui.panelBody}`}>
          <MemberMemoForm memberId={m.id} memo={m.memo} />
        </section>
      </div>

      <div className={ui.grid2} style={{ marginTop: 16 }}>
        <section className={ui.panel}>
          <div className={ui.panelHead}>
            <h2 className={ui.panelTitle}>릴레이 {relays.length}건</h2>
            <span className={ui.panelNote}>계산한 매장에서 번호로 넣은 것</span>
          </div>
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>받은 시각</th>
                  <th>매장</th>
                  <th>담당</th>
                  <th>어디서 썼나</th>
                  <th className={ui.right}>금액</th>
                </tr>
              </thead>
              <tbody>
                {relays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={ui.empty}>
                      아직 받은 릴레이가 없습니다.
                    </td>
                  </tr>
                ) : (
                  relays.map((r) => {
                    const c = r.couponId ? couponByReceipt.get(r.id) : null;
                    return (
                      <tr key={r.id}>
                        <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(r.createdAt, now)}</td>
                        <td>
                          <StoreTag id={r.storeId} />
                        </td>
                        <td className={`${ui.mono} ${ui.dim}`}>{r.reviewedBy ?? "-"}</td>
                        <td>
                          {c ? (
                            <>
                              <StoreTag id={c.useStoreId} /> {c.menuName}{" "}
                              <Link href={`/admin/coupons?code=${c.code}`} className={`${ui.rowLink} ${ui.mono}`}>
                                {c.code}
                              </Link>
                            </>
                          ) : isPickExpired(r, rules, now) ? (
                            <Badge tone="muted">기간 지남</Badge>
                          ) : (
                            <Badge tone="warn">아직 안 고름</Badge>
                          )}
                        </td>
                        <td className={ui.num}>{r.amount != null ? won(r.amount) : "-"}</td>
                      </tr>
                    );
                  })
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
                  <th>매장 · 혜택</th>
                  <th>종류</th>
                  <th>만료</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={ui.empty}>
                      아직 쿠폰이 없습니다.
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
          <h2 className={ui.panelTitle}>이 회원에게 쿠폰 주기</h2>
          <span className={ui.panelNote}>릴레이와 별개로 매장이 직접 주는 쿠폰 · 이유는 메모에</span>
        </div>
        <div className={ui.panelBody}>
          <IssueCouponForm mode="member" memberId={m.id} stores={STORES.map((st) => ({ id: st.id, shortName: st.shortName }))} gifts={gifts} tiers={rules.tiers} defaultDays={rules.couponValidDays} />
        </div>
      </section>
    </>
  );
}
