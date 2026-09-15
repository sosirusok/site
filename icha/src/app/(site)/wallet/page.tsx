import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon, maskPhone } from "@/lib/config";
import { getMember, listCouponsForMember, listReceiptsForMember } from "@/lib/db/queries";
import { getRules, tierFor } from "@/lib/settings";
import { STORES, getStore } from "@/lib/stores";
import { LogoutButton } from "@/components/flow/LogoutButton";
import { ActiveCoupons, PastCoupons, PendingReceipts, PickableReceipts, type WalletCoupon, type WalletReceipt } from "@/components/flow/WalletList";
import { storeNo } from "@/components/flow/format";
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
    return s ? { id: s.id, no: storeNo(s.id), shortName: s.shortName, drink: s.drink } : null;
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

  // 빈 쿠폰함에 보여 줄 실사진: 매장별 무료 사이드 후보(사진 있는 것). 없으면 사이드로 보이는 음식 사진(감자·튀김·전…)
  const SIDE_HINTS = ["감자", "튀김", "전", "샐러드", "계란", "만두"];
  const teasers = STORES.map((s) => {
    const gift = s.menu.find((m) => m.gift && m.image);
    const foods = s.images.filter((i) => i.kind === "food");
    const food = foods.find((i) => SIDE_HINTS.some((h) => i.alt.includes(h))) ?? foods[0];
    const src = gift?.image ?? food?.src ?? null;
    return src ? { id: s.id, no: storeNo(s.id), name: s.shortName, src, alt: gift ? gift.name : (food?.alt ?? ""), label: gift?.name ?? "사이드 한 접시" } : null;
  }).filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <section className={`wrap ${styles.page}`}>
      {rules.notice && <p className={styles.notice}>{rules.notice}</p>}

      <header className={styles.head}>
        <div className={styles.who}>
          <p className="eyebrow">쿠폰함</p>
          <p className={`mono ${styles.phone}`}>{maskPhone(member.phone)}</p>
          <p className={styles.tierLine}>
            <span className={styles.tier}>{tier.name}</span>
            <span className={`num ${styles.stats}`}>
              {member.visitCount}회 방문 · {formatWon(member.totalSpend)}
            </span>
          </p>
        </div>
        <div className={styles.progress} aria-label="등급 진행">
          <div className={styles.bar} role="img" aria-label={tier.next ? `${tier.next.name}까지 ${formatWon(tier.next.remaining)} 남음` : "최고 등급"}>
            <span className={styles.barFill} style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
          <p className={`num ${styles.ticks}`} aria-hidden="true">
            <span>{tier.name} {formatWon(currentMin)}</span>
            {nextMin != null && tier.next && <span>{tier.next.name} {formatWon(nextMin)}</span>}
          </p>
          <p className={styles.progressText}>
            {tier.next ? (
              <>
                <b className={`num ${styles.remain}`}>{formatWon(tier.next.remaining)}</b> 더 쓰면 <b>{tier.next.name}</b>이 돼요.
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
          <h2 className={styles.sectionTitle}>아직 안 고른 사이드 <span className={styles.count}>{pickable.length}</span></h2>
          <PickableReceipts receipts={pickable} />
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>쓸 수 있는 쿠폰 <span className={styles.count}>{active.length}</span></h2>
          {!empty && <Link href="/verify" className={styles.sectionLink}>영수증 더 올리기</Link>}
        </div>
        {active.length > 0 ? (
          <ActiveCoupons coupons={active} />
        ) : empty ? (
          <div className={styles.empty}>
            {teasers.length > 0 && (
              <ul className={styles.teasers} aria-label="무료로 받을 수 있는 사이드 예시">
                {teasers.map((t) => (
                  <li key={t.id} className={styles.teaser}>
                    <span className={styles.teaserPhoto}>
                      <Image src={t.src} alt={t.alt} fill sizes="(min-width: 760px) 33vw, 50vw" />
                    </span>
                    <span className={styles.teaserCap}>
                      <span className={styles.teaserNo}>{t.no}</span> {t.name} · {t.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.emptyText}>
              <p className={styles.emptyTitle}>아직 쿠폰이 없어요.</p>
              <p className={styles.emptyBody}>세 곳 중 한 곳의 영수증 한 장이면 돼요. 결제 후 {rules.receiptValidHours}시간 안에 올려 주세요.</p>
              <Link href="/verify" className="btn btn-lg">영수증 인증하기</Link>
            </div>
          </div>
        ) : (
          <p className={styles.none}>지금 쓸 수 있는 쿠폰은 없어요.</p>
        )}
      </div>

      {pending.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>확인 기다리는 영수증 <span className={styles.count}>{pending.length}</span></h2>
          <PendingReceipts receipts={pending} />
          <p className={`small ${styles.sectionNote}`}>직원이 사진을 확인하면 이 자리에 '사이드 고르기'가 생겨요. 영업 중에는 보통 몇 분이면 끝나요.</p>
        </div>
      )}

      {past.length > 0 && (
        <details className={styles.past}>
          <summary className={styles.pastSummary}>
            <span className={styles.sectionTitle}>지난 쿠폰 <span className={styles.count}>{past.length}</span></span>
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
