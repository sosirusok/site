import Link from "next/link";
import { formatWon } from "@/lib/config";
import { daysLeft, fmtDate, fmtDateTime, fmtShort } from "./format";
import styles from "./WalletList.module.css";

type StoreRef = { id: "joseon" | "tokyo" | "wareureu"; shortName: string; name: string };

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

/** 사용 가능 쿠폰 — 선으로 나눈 행, 행 전체가 링크 */
export function ActiveCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  const now = new Date();
  return (
    <ul className={styles.rows}>
      {coupons.map((c) => {
        const left = daysLeft(c.expiresAt, now);
        return (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={styles.coupon}>
              <span className={styles.couponMain}>
                <span className={styles.couponStore}>{c.store?.shortName ?? "매장 미정"} · {KIND_LABEL[c.kind]}</span>
                <span className={styles.couponName}>{c.menuName}</span>
                <span className={styles.couponExp}>
                  {fmtDate(c.expiresAt)}까지{left <= 7 ? ` (${Math.max(left, 0)}일 남음)` : ""}
                </span>
              </span>
              <span className={`mono ${styles.couponCode}`}>{c.code}</span>
              <span className={styles.couponMore}>상세</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PickableReceipts({ receipts }: { receipts: WalletReceipt[] }) {
  return (
    <ul className={styles.rows}>
      {receipts.map((r) => (
        <li key={r.id} className={styles.pickable}>
          <span className={styles.pickableMain}>
            <span className={styles.couponName}>{r.store?.shortName ?? "매장"} 영수증 승인</span>
            <span className={`mono ${styles.meta}`}>
              {fmtDateTime(r.receiptAt ?? r.createdAt)} · {r.amount == null ? "금액 미확인" : formatWon(r.amount)}
            </span>
          </span>
          <Link href={`/pick/${r.id}`} className="btn btn-red btn-sm">메뉴 선택</Link>
        </li>
      ))}
    </ul>
  );
}

export function PendingReceipts({ receipts }: { receipts: WalletReceipt[] }) {
  return (
    <table className="table">
      <thead className="sr-only">
        <tr><th scope="col">접수 시각</th><th scope="col">매장</th><th scope="col">상태</th></tr>
      </thead>
      <tbody>
        {receipts.map((r) => (
          <tr key={r.id}>
            <th scope="row" className={`mono ${styles.pendingWhen}`}>{fmtShort(r.createdAt)}</th>
            <td>{r.store ? r.store.shortName : "매장 미확인"}</td>
            <td className={styles.pendingState}>직원 확인 대기</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <ul className={styles.rows}>
      {coupons.map((c) => (
        <li key={c.id}>
          <Link href={`/coupons/${c.id}`} className={styles.past}>
            <span className={styles.pastMain}>
              <span className={styles.pastName}>{c.menuName}</span>
              <span className={styles.meta}>{c.store?.shortName ?? ""}</span>
            </span>
            <span className={`mono ${styles.pastState}`}>
              {c.status === "used" ? `사용 ${fmtShort(c.usedAt)}` : c.status === "expired" ? `만료 ${fmtDate(c.expiresAt)}` : "취소"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
