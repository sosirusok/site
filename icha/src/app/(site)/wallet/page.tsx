import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/flow/LogoutButton";
import { ActiveCoupons, EmptyWallet, PastCoupons, PendingReceipts, PickableReceipts, TierCard, type WalletCoupon, type WalletReceipt } from "@/components/flow/WalletSections";
import { getMemberSession } from "@/lib/auth/session";
import { STORE_IDS, type StoreId } from "@/lib/config";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { getMember, listCouponsForMember, listMenu, listReceiptsForMember, menuImageUrl, type MenuItem } from "@/lib/db/queries";
import { getRules, tierFor } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import styles from "./wallet.module.css";

export const metadata: Metadata = { title: "쿠폰함" };

/** 쿠폰 행 썸네일용 메뉴 사진 — 품목 번호로 먼저, 없으면 매장+품목 이름으로 찾는다 */
async function menuPhotoIndex(): Promise<(storeId: StoreId, menuItemId: number | null, menuName: string) => WalletCoupon["image"]> {
  const byId = new Map<number, MenuItem>();
  const byName = new Map<string, MenuItem>();
  await Promise.all(
    STORE_IDS.map(async (sid) => {
      for (const m of await listMenu(sid, { includeInactive: true })) {
        byId.set(m.id, m);
        if (!byName.has(`${sid}|${m.name}`)) byName.set(`${sid}|${m.name}`, m);
      }
    }),
  );
  return (storeId, menuItemId, menuName) => {
    const m = (menuItemId != null ? byId.get(menuItemId) : undefined) ?? byName.get(`${storeId}|${menuName}`);
    if (!m) return null;
    if (m.hasImageData) return { src: menuImageUrl(m), local: false };
    if (m.imagePath) return { src: m.imagePath, local: true };
    return null;
  };
}

export default async function WalletPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/wallet");
  const [member, coupons, receipts, rules, photoOf] = await Promise.all([
    getMember(session.memberId),
    listCouponsForMember(session.memberId),
    listReceiptsForMember(session.memberId, 60),
    getRules(),
    menuPhotoIndex(),
  ]);
  if (!member) redirect("/login?next=/wallet");

  // 등급과 다음 등급까지의 진행률 (현재 등급 기준 금액 → 다음 등급 기준 금액)
  const tier = tierFor(member.totalSpend, rules);
  const tiers = rules.tiers;
  const tierIdx = tiers.findIndex((t) => t.key === tier.key);
  const curMin = tierIdx >= 0 ? (tiers[tierIdx]?.minSpend ?? 0) : 0;
  const nextTier = tiers[tierIdx + 1] ?? null;
  const progress = nextTier ? Math.min(1, Math.max(0, (member.totalSpend - curMin) / Math.max(1, nextTier.minSpend - curMin))) : 1;

  const toStore = (id: string | null) => {
    const s = id ? getStore(id) : null;
    return s ? { id: s.id, shortName: s.shortName, name: s.name } : null;
  };
  const wc: WalletCoupon[] = coupons.map((c) => ({
    id: c.id, code: c.code, menuName: c.menuName, status: c.status, kind: c.kind,
    expiresAt: c.expiresAt.toISOString(), usedAt: c.usedAt?.toISOString() ?? null, store: toStore(c.useStoreId),
    image: photoOf(c.useStoreId, c.menuItemId, c.menuName),
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
    <div className={styles.page}>
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}

      <section className={`wrap ${styles.top}`}>
        <h1 className="h1-event">쿠폰함</h1>
        <TierCard tierName={tier.name} totalSpend={member.totalSpend} visitCount={member.visitCount} nextName={nextTier?.name ?? null} remaining={nextTier ? nextTier.minSpend - member.totalSpend : 0} progress={progress} />
      </section>

      {pickable.length > 0 && (
        <>
          <div className="band" />
          <PickableReceipts receipts={pickable} />
        </>
      )}

      <div className="band" />
      <section className={`wrap ${styles.sec} ${styles.block}`} aria-labelledby="wallet-active">
        <div className="section-h">
          <h2 id="wallet-active" className="h2-event">쓸 수 있는 쿠폰{active.length > 0 && <span className={styles.count}>{active.length}</span>}</h2>
          {!nothing && <Link href="/verify" className={`more ${styles.more}`}>영수증 올리기</Link>}
        </div>
        {nothing ? (
          <EmptyWallet />
        ) : active.length > 0 ? (
          <ActiveCoupons coupons={active} />
        ) : (
          <p className="cap">지금 쓸 수 있는 쿠폰이 없어요. 영수증을 올리면 바로 받아요.</p>
        )}
      </section>

      {pending.length > 0 && (
        <>
          <div className="band" />
          <PendingReceipts receipts={pending} />
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="band" />
          <PastCoupons coupons={past} />
        </>
      )}

      <div className="band" />
      <footer className={`wrap ${styles.sec} ${styles.foot}`}>
        <p className="cap">쿠폰은 받은 날부터 {rules.couponValidDays}일 동안 써요. 매장에서 직원 앞에서 '사용하기'를 눌러요.</p>
        <LogoutButton className="btn btn-secondary btn-sm" />
      </footer>
    </div>
  );
}
