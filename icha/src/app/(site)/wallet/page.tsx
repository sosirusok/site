import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon, maskPhone } from "@/lib/config";
import { getMember, listCouponsForMember, listReceiptsForMember } from "@/lib/db/queries";
import { getRules, tierFor } from "@/lib/settings";
import { getStore } from "@/lib/stores";
import { ReceiptIcon } from "@/components/ui/icons";
import { LogoutButton } from "@/components/flow/LogoutButton";
import { ActiveCoupons, PastCoupons, PendingReceipts, PickableReceipts, type WalletCoupon, type WalletReceipt } from "@/components/flow/WalletList";
import styles from "./wallet.module.css";

export const metadata: Metadata = { title: "내 쿠폰함" };

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
  const currentMin = rules.tiers.find((t) => t.key === tier.key)?.minSpend ?? 0;
  const nextMin = tier.next ? member.totalSpend + tier.next.remaining : null;
  const ratio = nextMin ? Math.min(1, Math.max(0, (member.totalSpend - currentMin) / (nextMin - currentMin))) : 1;

  const toStore = (id: string | null) => {
    const s = id ? getStore(id) : null;
    return s ? { id: s.id, shortName: s.shortName, drink: s.drink } : null;
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
  const pickable = wr.filter((r) => r.status === "approved" && r.store && !couponReceiptIds.has(r.id));
  const empty = active.length === 0 && pending.length === 0 && pickable.length === 0;

  return (
    <section className={`wrap ${styles.page}`}>
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}

      <header className={styles.head}>
        <div className={styles.who}>
          <p className="eyebrow">쿠폰함</p>
          <p className={`mono ${styles.phone}`}>{maskPhone(member.phone)}</p>
          <p className={styles.tierLine}>
            <span className={`serif ${styles.tier}`}>{tier.name}</span>
            <span className={`mono ${styles.stats}`}>
              {member.visitCount}회 · {formatWon(member.totalSpend)}
            </span>
          </p>
        </div>
        <div className={styles.progress} aria-label="등급 진행">
          <div className={styles.bar} role="img" aria-label={tier.next ? `${tier.next.name}까지 ${formatWon(tier.next.remaining)} 남음` : "최고 등급"}>
            <span className={styles.barFill} style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
          <p className={`mono ${styles.ticks}`} aria-hidden="true">
            <span>{tier.name} {formatWon(currentMin)}</span>
            {nextMin != null && tier.next && <span>{tier.next.name} {formatWon(nextMin)}</span>}
          </p>
          <p className={styles.progressText}>
            {tier.next ? (
              <>
                <b className="mono">{formatWon(tier.next.remaining)}</b> 더 쓰면 <b>{tier.next.name}</b>이 돼요.
              </>
            ) : (
              <>가장 높은 등급이에요. 고마워요.</>
            )}
            <span className={`small ${styles.progressHint}`}>승인된 영수증 금액이 누적돼요.</span>
          </p>
        </div>
      </header>

      {pickable.length > 0 && (
        <div className={styles.section}>
          <h2 className={`h3 ${styles.sectionTitle}`}>아직 안 고른 사이드 <span className="mono">{pickable.length}</span></h2>
          <PickableReceipts receipts={pickable} />
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={`h3 ${styles.sectionTitle}`}>쓸 수 있는 쿠폰 <span className="mono">{active.length}</span></h2>
          {!empty && <Link href="/verify" className={styles.sectionLink}>영수증 더 올리기</Link>}
        </div>
        {active.length > 0 ? (
          <ActiveCoupons coupons={active} />
        ) : empty ? (
          <div className={`paper ${styles.empty}`}>
            <ReceiptIcon size={36} />
            <p className={`serif ${styles.emptyTitle}`}>아직 쿠폰이 없어요.</p>
            <p className={styles.emptyText}>세 곳 중 한 곳의 영수증 한 장이면 돼요. 결제 후 {rules.receiptValidHours}시간 안에 올려 주세요.</p>
            <Link href="/verify" className="btn btn-lg">영수증 인증하기</Link>
          </div>
        ) : (
          <p className={styles.none}>지금 쓸 수 있는 쿠폰은 없어요.</p>
        )}
      </div>

      {pending.length > 0 && (
        <div className={styles.section}>
          <h2 className={`h3 ${styles.sectionTitle}`}>확인 기다리는 영수증 <span className="mono">{pending.length}</span></h2>
          <PendingReceipts receipts={pending} />
          <p className={`small ${styles.sectionNote}`}>직원이 사진을 확인하면 이 자리에 '사이드 고르기'가 생겨요. 영업 중에는 보통 몇 분이면 끝나요.</p>
        </div>
      )}

      {past.length > 0 && (
        <details className={styles.past}>
          <summary className={styles.pastSummary}>
            <span className={`h3 ${styles.sectionTitle}`}>지난 쿠폰 <span className="mono">{past.length}</span></span>
            <span className={styles.pastToggle} aria-hidden="true">펼치기</span>
          </summary>
          <PastCoupons coupons={past} />
        </details>
      )}

      <footer className={styles.foot}>
        <p className="small">쿠폰은 발급일부터 {rules.couponValidDays}일 동안 쓸 수 있어요. 궁금한 점은 <Link href="/guide" className={styles.link}>이용 방법</Link>에.</p>
        <LogoutButton className={styles.logout} />
      </footer>
    </section>
  );
}
