import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/flow/LogoutButton";
import { ActiveCoupons, EmptyWallet, PastCoupons, RelayCards, type WalletCoupon, type WalletRelay } from "@/components/flow/WalletSections";
import { PlaceButton } from "@/components/site/PlaceButton";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND, STORE_IDS, type StoreId } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { listCouponsForMember, listMenu, listReceiptsForMember, menuImageUrl, type MenuItem } from "@/lib/db/queries";
import { placeSheetStores } from "@/lib/place-stores";
import { getRules } from "@/lib/settings";
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

/**
 * 쿠폰함 — 번호 하나에 담긴 쿠폰. 위에서부터: 받은 쿠폰(아직 어디서 쓸지 안 고름) → 쓸 수 있는 쿠폰 → 지난 쿠폰.
 * 사진·등급·누적 금액은 없다(사장님 결정).
 */
export default async function WalletPage() {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/wallet");
  const [coupons, receipts, rules, photoOf] = await Promise.all([
    listCouponsForMember(session.memberId),
    listReceiptsForMember(session.memberId, 60),
    getRules(),
    menuPhotoIndex(),
  ]);

  const toStore = (id: string | null) => {
    const s = id ? getStore(id) : null;
    return s ? { id: s.id, shortName: s.shortName, name: s.name } : null;
  };
  const wc: WalletCoupon[] = coupons.map((c) => ({
    id: c.id, code: c.code, menuName: c.menuName, status: c.status, kind: c.kind,
    expiresAt: c.expiresAt.toISOString(), usedAt: c.usedAt?.toISOString() ?? null, store: toStore(c.useStoreId),
    image: photoOf(c.useStoreId, c.menuItemId, c.menuName),
  }));
  const active = wc.filter((c) => c.status === "active");
  const past = wc.filter((c) => c.status !== "active");

  // 받은 쿠폰(릴레이): 승인됐고, 아직 쿠폰으로 안 바꿨고, 고를 수 있는 기간 안
  const couponReceiptIds = new Set(coupons.map((c) => c.receiptId).filter(Boolean));
  const relays: WalletRelay[] = receipts.flatMap((r) => {
    const store = toStore(r.storeId);
    if (r.status !== "approved" || !store || r.couponId || couponReceiptIds.has(r.id) || isPickExpired(r, rules)) return [];
    return [{ id: r.id, store, giftNames: giftStoresFor(store.id).map((s) => s.shortName), deadline: pickDeadlineFor(r, rules).toISOString() }];
  });
  const nothing = active.length === 0 && past.length === 0 && relays.length === 0;
  const places = placeSheetStores();

  return (
    <div className={styles.page}>
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}

      <section className={`wrap ${styles.top}`}>
        <h1 className="h1-event">쿠폰함</h1>
        <p className="cap">쓸 때 직원에게 이 화면을 보여 주세요.</p>
      </section>

      {nothing ? (
        <section className="wrap" aria-label="빈 쿠폰함">
          <EmptyWallet stores={places} />
        </section>
      ) : (
        <>
          {relays.length > 0 && (
            <>
              <div className="band" />
              <RelayCards relays={relays} />
            </>
          )}

          <div className="band" />
          <section className={`wrap ${styles.sec}`} aria-labelledby="wallet-active">
            <div className="section-h">
              <h2 id="wallet-active" className="h2-event">쓸 수 있는 쿠폰{active.length > 0 && <span className={styles.count}>{active.length}</span>}</h2>
            </div>
            {active.length > 0 ? <ActiveCoupons coupons={active} /> : <p className="cap">{relays.length > 0 ? "위에서 어디서 쓸지 고르면 여기에 들어와요." : "지금 쓸 수 있는 쿠폰이 없어요."}</p>}
          </section>

          {past.length > 0 && (
            <>
              <div className="band" />
              <PastCoupons coupons={past} />
            </>
          )}
        </>
      )}

      <div className="band" />
      <footer className={`wrap ${styles.sec} ${styles.foot}`}>
        {!nothing && <PlaceButton stores={places} className="btn btn-naver btn-block">예약하기</PlaceButton>}
        <p className="cap">{ruleLine(rules)} · {BRAND.condition}</p>
        <LogoutButton className="btn btn-secondary btn-sm" />
      </footer>
    </div>
  );
}
