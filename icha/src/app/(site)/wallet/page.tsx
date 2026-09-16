import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon, maskPhone } from "@/lib/config";
import { getMember, listCouponsForMember, listReceiptsForMember } from "@/lib/db/queries";
import { getRules, tierFor } from "@/lib/settings";
import { isPickExpired } from "@/lib/coupons";
import { getStore } from "@/lib/stores";
import { LogoutButton } from "@/components/flow/LogoutButton";
import { ActiveCoupons, PastCoupons, PendingReceipts, PickableReceipts, type WalletCoupon, type WalletReceipt } from "@/components/flow/WalletList";
import styles from "./wallet.module.css";

export const metadata: Metadata = { title: "쿠폰함" };

export default async function WalletPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/wallet");
  const [member, coupons, receipts, rules] = await Promise.all([
    getMember(session.memberId),
    listCouponsForMember(session.memberId),
    listReceiptsForMember(session.memberId, 40),
    getRules(),
  ]);
  if (!member) redirect("/login?next=/wallet");

  const tier = tierFor(member.totalSpend, rules);

  const toStore = (id: string | null) => {
    const s = id ? getStore(id) : null;
    return s ? { id: s.id, shortName: s.shortName, name: s.name } : null;
  };
  const wc: WalletCoupon[] = coupons.map((c) => ({
    id: c.id, code: c.code, menuName: c.menuName, status: c.status, kind: c.kind,
    expiresAt: c.expiresAt.toISOString(), usedAt: c.usedAt?.toISOString() ?? null, store: toStore(c.useStoreId),
  }));
  const wr: WalletReceipt[] = receipts.map((r) => ({
    id: r.id, status: r.status, createdAt: r.createdAt.toISOString(), receiptAt: r.receiptAt?.toISOString() ?? null,
    amount: r.amount, reasons: r.reasons, store: toStore(r.storeId),
  }));

  const active = wc.filter((c) => c.status === "active");
  const past = wc.filter((c) => c.status !== "active");
  const pending = wr.filter((r) => r.status === "review");
  const couponReceiptIds = new Set(coupons.map((c) => c.receiptId).filter(Boolean));
  const pickExpiredIds = new Set(receipts.filter((r) => isPickExpired(r, rules)).map((r) => r.id));
  const pickable = wr.filter((r) => r.status === "approved" && r.store && !couponReceiptIds.has(r.id) && !pickExpiredIds.has(r.id));

  return (
    <section className={`wrap ${styles.page}`}>
      <div className={styles.col}>
        {rules.notice && <p className={styles.notice}>{rules.notice}</p>}

        <header className={styles.head}>
          <div className={styles.who}>
            <h1 className="h2">쿠폰함</h1>
            <p className={`mono ${styles.phone}`}>{maskPhone(member.phone)}</p>
          </div>
          <LogoutButton className="btn btn-outline btn-sm" />
        </header>

        <table className="table" aria-label="회원 정보">
          <tbody>
            <tr>
              <th scope="row">등급</th>
              <td><b>{tier.name}</b></td>
            </tr>
            <tr>
              <th scope="row">누적 결제</th>
              <td><span className="mono">{formatWon(member.totalSpend)}</span> · {member.visitCount}회 방문</td>
            </tr>
            <tr>
              <th scope="row">다음 등급</th>
              <td>{tier.next ? `${tier.next.name}까지 ${formatWon(tier.next.remaining)} 남았습니다.` : "최고 등급입니다."}</td>
            </tr>
          </tbody>
        </table>
        <p className={`small ${styles.tierHint}`}>승인된 영수증의 결제 금액이 누적됩니다.</p>

        {pickable.length > 0 && (
          <div className={styles.section}>
            <div className="sec-head">
              <h2 className="h3">사이드 메뉴 미선택 영수증 <span className={styles.count}>{pickable.length}</span></h2>
            </div>
            <PickableReceipts receipts={pickable} />
          </div>
        )}

        <div className={styles.section}>
          <div className="sec-head">
            <h2 className="h3">사용 가능 쿠폰 <span className={styles.count}>{active.length}</span></h2>
            <Link href="/verify" className="more">영수증 인증</Link>
          </div>
          {active.length > 0 ? (
            <ActiveCoupons coupons={active} />
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyText}>사용 가능한 쿠폰이 없습니다. 참여 매장에서 결제한 영수증을 {rules.receiptValidHours}시간 안에 인증하면 쿠폰을 받을 수 있습니다.</p>
              <Link href="/verify" className="btn btn-red btn-lg">영수증 인증</Link>
            </div>
          )}
        </div>

        {pending.length > 0 && (
          <div className={styles.section}>
            <div className="sec-head">
              <h2 className="h3">확인 대기 영수증 <span className={styles.count}>{pending.length}</span></h2>
            </div>
            <PendingReceipts receipts={pending} />
            <p className={`small ${styles.sectionNote}`}>직원이 사진을 확인하면 이 자리에 사이드 메뉴 선택 버튼이 표시됩니다.</p>
          </div>
        )}

        {past.length > 0 && (
          <details className={styles.past}>
            <summary className={styles.pastSummary}>
              <span className="h3">지난 쿠폰 <span className={styles.count}>{past.length}</span></span>
              <span className={styles.pastToggle}>펼치기</span>
            </summary>
            <PastCoupons coupons={past} />
          </details>
        )}

        <footer className={styles.foot}>
          <p className="small">
            쿠폰은 발급일부터 {rules.couponValidDays}일간 사용할 수 있습니다. 자세한 내용은 <Link href="/guide" className={styles.link}>이용 안내</Link>에서 확인할 수 있습니다.
          </p>
        </footer>
      </div>
    </section>
  );
}
