import Link from "next/link";
import { formatWon } from "@/lib/config";
import { daysLeft, fmtDate, fmtDateTime, fmtShort } from "./format";
import styles from "./WalletList.module.css";

type StoreRef = { id: "joseon" | "tokyo" | "wareureu"; no: string; shortName: string; drink: "막걸리" | "맥주" | "소주" };

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
  reasons: string[];
  store: StoreRef | null;
};

const KIND_LABEL: Record<WalletCoupon["kind"], string> = { side: "영수증 인증", vip: "등급 혜택", manual: "매장 발급" };

/** 사용 가능 쿠폰 — 어두운 바탕 위 종이 티켓 */
export function ActiveCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  const now = new Date();
  return (
    <ul className={styles.tickets}>
      {coupons.map((c) => {
        const left = daysLeft(c.expiresAt, now);
        return (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={`paper-shadow ${styles.ticket}`}>
              <span className={styles.stub} aria-hidden="true">
                <span className={styles.stubNo}>{c.store?.no ?? "--"}</span>
                <span className={styles.stubDrink}>{c.store?.drink ?? ""}</span>
              </span>
              <span className={styles.ticketBody}>
                <span className={styles.ticketStore}>
                  <span>{c.store?.shortName ?? "매장 미정"}</span>
                  <span className={styles.kind}>{KIND_LABEL[c.kind]}</span>
                </span>
                <span className={styles.ticketName}>{c.menuName}</span>
                <span className={`mono ${styles.ticketMeta}`}>
                  <span className={styles.ticketCode}>{c.code}</span>
                  <span className={left <= 3 ? styles.urgent : undefined}>
                    {fmtDate(c.expiresAt)}까지{left <= 7 ? ` · ${Math.max(left, 0)}일 남음` : ""}
                  </span>
                </span>
              </span>
              <span className={styles.ticketArrow} aria-hidden="true">→</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PickableReceipts({ receipts }: { receipts: WalletReceipt[] }) {
  return (
    <ul className={styles.pickables}>
      {receipts.map((r) => (
        <li key={r.id} className={styles.pickable}>
          <div className={styles.pickableText}>
            <p className={styles.pickableTitle}>
              <span className={styles.pickableNo} aria-hidden="true">{r.store?.no ?? "--"}</span>
              <b>{r.store?.shortName ?? "매장"}</b> 영수증이 승인됐어요.
            </p>
            <p className={`mono ${styles.pickableMeta}`}>
              {fmtDateTime(r.receiptAt ?? r.createdAt)} · {r.amount == null ? "금액 미확인" : formatWon(r.amount)}
            </p>
          </div>
          <Link href={`/pick/${r.id}`} className="btn">사이드 고르기</Link>
        </li>
      ))}
    </ul>
  );
}

export function PendingReceipts({ receipts }: { receipts: WalletReceipt[] }) {
  return (
    <ul className={styles.pending}>
      {receipts.map((r) => (
        <li key={r.id} className={styles.pendingRow}>
          <span className={`mono ${styles.pendingWhen}`}>{fmtShort(r.createdAt)} 접수</span>
          <span className={styles.pendingStore}>{r.store ? `${r.store.shortName} 영수증` : "매장 확인 중"}</span>
          <span className={styles.pendingState}>직원 확인 대기</span>
        </li>
      ))}
    </ul>
  );
}

export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <ul className={styles.past}>
      {coupons.map((c) => (
        <li key={c.id} className={styles.pastRow}>
          <Link href={`/coupons/${c.id}`} className={styles.pastLink}>
            <span className={styles.pastNo} aria-hidden="true">{c.store?.no ?? "--"}</span>
            <span className={styles.pastName}>
              {c.menuName} <span className={styles.pastStore}>{c.store?.shortName ?? ""}</span>
            </span>
            <span className={`mono ${styles.pastState}`}>
              {c.status === "used" ? `사용 ${fmtShort(c.usedAt)}` : c.status === "expired" ? `만료 ${fmtDate(c.expiresAt)}` : "취소됨"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
