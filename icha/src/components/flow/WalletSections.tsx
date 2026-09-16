import Image from "next/image";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import type { StoreId } from "@/lib/config";
import { formatWon } from "@/lib/config";
import { daysLeft, fmtDate, fmtMD, fmtMDHM, joinNames } from "./format";
import styles from "./WalletSections.module.css";

type StoreRef = { id: StoreId; shortName: string; name: string };

export type WalletCoupon = {
  id: string;
  code: string;
  menuName: string;
  status: "active" | "used" | "expired" | "void";
  kind: "side" | "vip" | "manual";
  expiresAt: string;
  usedAt: string | null;
  store: StoreRef | null;
};

export type WalletReceipt = {
  id: string;
  status: "approved" | "review" | "rejected";
  createdAt: string;
  receiptAt: string | null;
  amount: number | null;
  store: StoreRef | null;
  /** 승인 영수증: 고를 수 있는 마지막 날 */
  deadline: string | null;
  /** 승인 영수증: 고를 수 있는 집 */
  giftNames: string[];
};

const STAMP = { src: "/art/stamp-used.png", width: 279, height: 116 };

/** 티켓 그림: VIP 일괄 발급 쿠폰은 VIP 티켓, 나머지는 사용 매장 티켓 */
function ticketName(c: WalletCoupon): string {
  return c.kind === "vip" ? "vip-coupon" : `coupon-${c.store?.id ?? "joseon"}`;
}

/* 아직 안 고른 승인 영수증 */
export function PickableReceipts({ receipts }: { receipts: WalletReceipt[] }) {
  return (
    <section className={`panel ${styles.pickBox}`} aria-labelledby="wallet-pick">
      <h2 id="wallet-pick" className="h3">아직 안 고른 영수증</h2>
      <ul className={styles.pickList}>
        {receipts.map((r) => (
          <li key={r.id} className={styles.pickRow}>
            <p className={styles.pickLine}>
              <b>{r.store?.shortName ?? "매장"}</b> 영수증 · {fmtMDHM(r.receiptAt ?? r.createdAt)} · {r.amount == null ? "금액 확인 중" : formatWon(r.amount)}
            </p>
            <p className={styles.pickSub}>
              {joinNames(r.giftNames)} 중 한 곳에서 한 잔 고를 수 있어요.{r.deadline ? ` ${fmtMD(r.deadline)}까지예요.` : ""}
            </p>
            <ArtButton kind="choose" href={`/pick/${r.id}`} width={340} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 쓸 수 있는 쿠폰: 티켓 그림 + 코드 */
export function ActiveCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  const now = new Date();
  return (
    <ul className={styles.coupons}>
      {coupons.map((c) => {
        const left = daysLeft(c.expiresAt, now);
        return (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={styles.coupon}>
              <span className={styles.couponArt}>
                <Art name={ticketName(c)} alt="" sizes="(min-width: 760px) 460px, 90vw" />
              </span>
              <span className={styles.couponLine}>
                <span className={`mono ${styles.couponCode}`}>{c.code}</span>
                <span className={styles.couponExp}>{fmtMD(c.expiresAt)}까지{left <= 7 ? ` · ${Math.max(left, 0)}일 남음` : ""}</span>
              </span>
              <span className={styles.couponWhat}>
                {c.store?.shortName ?? "매장"} · {c.menuName} 무료{c.kind === "vip" ? " · VIP 쿠폰" : c.kind === "manual" ? " · 매장에서 드린 쿠폰" : ""}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* 직원 확인 대기 영수증 */
export function PendingReceipts({ receipts }: { receipts: WalletReceipt[] }) {
  return (
    <section className={styles.pending} aria-labelledby="wallet-pending">
      <div className={styles.pendingHead}>
        <span className={styles.pendingArt} aria-hidden="true"><Art name="status-checking" sizes="64px" /></span>
        <div>
          <h2 id="wallet-pending" className="h3">직원이 확인하는 중</h2>
          <p className={styles.pendingText}>확인이 끝나면 여기서 바로 고를 수 있어요.</p>
        </div>
      </div>
      <ul className={styles.pendingList}>
        {receipts.map((r) => (
          <li key={r.id}>
            {fmtMDHM(r.createdAt)}에 올린 {r.store ? `${r.store.shortName} 영수증` : "영수증"}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 지난 쿠폰: 사용(스탬프) / 만료 / 취소 */
export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <details className={styles.past}>
      <summary className={styles.pastSummary}>
        <span className="h3">지난 쿠폰 {coupons.length}장</span>
        <span className={styles.pastToggle} aria-hidden="true">펼치기</span>
      </summary>
      <ul className={styles.pastList}>
        {coupons.map((c) => (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={styles.pastRow} data-status={c.status}>
              <span className={styles.pastArt} aria-hidden="true">
                {c.status === "expired" ? (
                  <Art name="wallet-expired" sizes="72px" />
                ) : (
                  <>
                    <Art name={ticketName(c)} sizes="(min-width: 760px) 200px, 44vw" className={styles.pastTicket} />
                    {c.status === "used" && <Image src={STAMP.src} alt="" width={STAMP.width} height={STAMP.height} sizes="80px" className={styles.stamp} draggable={false} />}
                  </>
                )}
              </span>
              <span className={styles.pastText}>
                <span className={styles.pastName}>{c.store?.shortName ?? ""} · {c.menuName}</span>
                <span className={styles.pastState}>
                  {c.status === "used" ? `${fmtMDHM(c.usedAt)}에 썼어요` : c.status === "expired" ? `${fmtDate(c.expiresAt)}에 기간이 지났어요` : "매장에서 취소했어요"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* 아무것도 없을 때 */
export function EmptyWallet() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyArt} aria-hidden="true"><Art name="empty-pocket" sizes="(min-width: 760px) 260px, 55vw" /></div>
      <p className={styles.emptyText}>아직 쿠폰이 없어요. 영수증을 올리면 여기 담겨요.</p>
      <ArtButton kind="start" href="/verify" width={340} />
    </div>
  );
}
