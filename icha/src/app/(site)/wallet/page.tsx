import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Art } from "@/components/art/Art";
import { LogoutButton } from "@/components/flow/LogoutButton";
import { MemberCard } from "@/components/flow/MemberCard";
import { ActiveCoupons, EmptyWallet, PastCoupons, PendingReceipts, PickableReceipts, type WalletCoupon, type WalletReceipt } from "@/components/flow/WalletSections";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon, type StoreId } from "@/lib/config";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { query } from "@/lib/db";
import { getMember, listCouponsForMember, listReceiptsForMember } from "@/lib/db/queries";
import { getRules, tierFor } from "@/lib/settings";
import { STORES, getStore, giftStoresFor } from "@/lib/stores";
import styles from "./wallet.module.css";

export const metadata: Metadata = { title: "쿠폰함" };

/** 매장별 누적 인정 금액 (spend_ledger) */
async function spendByStore(memberId: string): Promise<Record<string, number>> {
  const rows = await query<{ store_id: string | null; total: number }>(`select store_id, sum(amount)::int as total from spend_ledger where member_id=$1 group by store_id`, [memberId]);
  const out: Record<string, number> = {};
  for (const r of rows) if (r.store_id) out[r.store_id] = Number(r.total);
  return out;
}

const LEDGER_PAPER = "rgb(251,245,233)";

export default async function WalletPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/wallet");
  const [member, coupons, receipts, rules, byStore] = await Promise.all([
    getMember(session.memberId),
    listCouponsForMember(session.memberId),
    listReceiptsForMember(session.memberId, 60),
    getRules(),
    spendByStore(session.memberId),
  ]);
  if (!member) redirect("/login?next=/wallet");

  const tier = tierFor(member.totalSpend, rules);
  const tiers = rules.tiers;
  const tierIdx = tiers.findIndex((t) => t.key === tier.key);
  const nextTier = tiers[tierIdx + 1] ?? null;
  const progress = nextTier ? Math.min(1, member.totalSpend / Math.max(1, nextTier.minSpend)) : 1;

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
    amount: r.amount, store: toStore(r.storeId),
    deadline: r.status === "approved" ? pickDeadlineFor(r, rules).toISOString() : null,
    giftNames: r.storeId ? giftStoresFor(r.storeId as StoreId).map((s) => s.shortName) : [],
  }));

  const active = wc.filter((c) => c.status === "active");
  const past = wc.filter((c) => c.status !== "active");
  const pending = wr.filter((r) => r.status === "review");
  const couponReceiptIds = new Set(coupons.map((c) => c.receiptId).filter(Boolean));
  const pickExpiredIds = new Set(receipts.filter((r) => isPickExpired(r, rules)).map((r) => r.id));
  const pickable = wr.filter((r) => r.status === "approved" && r.store && !couponReceiptIds.has(r.id) && !pickExpiredIds.has(r.id));
  const nothing = active.length === 0 && past.length === 0 && pending.length === 0 && pickable.length === 0;

  return (
    <section className={`wrap ${styles.page}`}>
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}

      <header className={styles.head}>
        <h1 className="h1">쿠폰함</h1>
      </header>

      {/* 내 혜택: 회원 카드 + 진행 막대 + 매장별 장부 */}
      <section id="tier" className={styles.tier} aria-labelledby="tier-title">
        <div className={styles.tierHead}>
          <Art name="vip-symbol" width={64} alt="" />
          <h2 id="tier-title" className="h2">내 혜택</h2>
        </div>
        <MemberCard phone={member.phone} totalSpend={member.totalSpend} visitCount={member.visitCount} rules={rules} />

        <div className={styles.progressBlock}>
          <div className={styles.track} aria-hidden="true">
            <Art name="vip-progress" sizes="(min-width: 760px) 520px, 92vw" />
            <span className={styles.fill} style={{ width: `calc(3.4% + ${(progress * 86.8).toFixed(1)}%)` }} />
          </div>
          <p className={styles.progressText}>
            {nextTier
              ? <>지금 <b>{tier.name}</b>이고, <b>{nextTier.name}</b>까지 {formatWon(nextTier.minSpend - member.totalSpend)} 남았어요. 세 집 어디서 쓰든 합쳐져요.</>
              : <>가장 높은 등급 <b>{tier.name}</b>이에요. 사장님들이 정한 때에 쿠폰이 따로 들어와요.</>}
          </p>
        </div>

        <div className={styles.ledgerRow}>
          <div className={styles.ledger}>
            <Art name="ledger" alt="매장별 누적 금액" sizes="(min-width: 760px) 260px, 56vw" />
            {STORES.map((s, i) => (
              <span key={s.id} className={styles.ledgerRowBox} style={{ top: `${[29.6, 54.6, 79.4][i]}%` }}>
                <span className={styles.ledgerDash} style={{ background: LEDGER_PAPER }} aria-hidden="true" />
                <span className={`mono ${styles.ledgerAmt}`} aria-label={`${s.shortName} ${formatWon(byStore[s.id] ?? 0)}`}>{formatWon(byStore[s.id] ?? 0)}</span>
              </span>
            ))}
          </div>
          <p className={styles.ledgerText}>
            승인된 영수증의 금액이 집마다 따로 적혀요. 등급은 셋을 합친 금액으로 정하고, 지금까지 {member.visitCount}번 인증했어요.
          </p>
        </div>
      </section>

      {pickable.length > 0 && <PickableReceipts receipts={pickable} />}

      <section className={styles.block} aria-labelledby="wallet-active">
        <h2 id="wallet-active" className="h2">쓸 수 있는 쿠폰 {active.length > 0 && <span className={styles.count}>{active.length}</span>}</h2>
        {nothing ? (
          <EmptyWallet />
        ) : active.length > 0 ? (
          <ActiveCoupons coupons={active} />
        ) : (
          <p className={styles.none}>지금 쓸 수 있는 쿠폰은 없어요. 영수증을 올리면 {rules.receiptValidHours}시간 안 결제 건은 바로 확인돼요.</p>
        )}
      </section>

      {pending.length > 0 && <PendingReceipts receipts={pending} />}

      {past.length > 0 && <PastCoupons coupons={past} />}

      <footer className={styles.foot}>
        <p className={styles.footText}>쿠폰은 받은 날부터 {rules.couponValidDays}일 동안 쓸 수 있어요. 직원 앞에서 '사용하기'를 누르면 끝이에요.</p>
        <LogoutButton className="btn btn-ghost btn-sm" />
      </footer>
    </section>
  );
}
