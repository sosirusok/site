import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DotLine } from "@/components/flow/kit";
import { LogoutButton } from "@/components/flow/LogoutButton";
import { ActiveCoupons, EmptyWallet, PastCoupons, RelayCards, type WalletCoupon, type WalletRelay } from "@/components/flow/WalletSections";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND, maskPhone, STORE_IDS, type StoreId } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { listCouponsForMember, listMenu, listReceiptsForMember, menuImageUrl, type MenuItem } from "@/lib/db/queries";
import { placeSheetStores } from "@/lib/place-stores";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import styles from "./wallet.module.css";

export const metadata: Metadata = { title: "쿠폰함" };

/** 쿠폰 카드용 메뉴 사진 — 품목 번호로 먼저, 없으면 매장+품목 이름으로 찾는다 */
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
 * 쿠폰함 — 제목(내 번호) → (공지) → 받은 쿠폰(아직 사용 매장을 안 고름) → 사용 가능 쿠폰 → 지난 쿠폰 → 조건·로그아웃.
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
      <header className={styles.top}>
        <span className="eyebrow">My coupons</span>
        <h1 className="h1">쿠폰함</h1>
        <p className="small muted num">{maskPhone(session.phone)} · 사용 시 직원에게 이 화면을 보여 주세요</p>
      </header>

      {rules.notice && <p className={styles.notice}><b className={styles.noticeTag}>공지</b>{rules.notice}</p>}

      {nothing ? (
        <section className={styles.sec} aria-label="빈 쿠폰함">
          <EmptyWallet stores={places} />
        </section>
      ) : (
        <>
          {relays.length > 0 && <RelayCards relays={relays} />}

          <section className={styles.sec} aria-labelledby="wallet-active">
            <div className={styles.head}>
              <h2 id="wallet-active" className="h3">사용 가능 쿠폰 <span className={styles.count}>{active.length}</span></h2>
            </div>
            {active.length > 0 ? <ActiveCoupons coupons={active} /> : <p className={`box small muted ${styles.none}`}>{relays.length > 0 ? "받은 쿠폰에서 사용 매장을 선택하면 여기에 표시됩니다." : "사용 가능한 쿠폰이 없습니다."}</p>}
          </section>

          {past.length > 0 && <PastCoupons coupons={past} />}
        </>
      )}

      <footer className={`${styles.sec} ${styles.foot}`}>
        <ul className="notice" aria-label="이용 조건">
          <li><DotLine items={[ruleLine(rules), BRAND.condition]} /></li>
          <li>쿠폰 1장당 매장 1곳 · 발급 후 변경 불가</li>
        </ul>
        <LogoutButton className="btn btn-ghost btn-sm" />
      </footer>
    </div>
  );
}
