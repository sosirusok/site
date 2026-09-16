import Image from "next/image";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { Chevron } from "@/components/ui/Chevron";
import type { StoreId } from "@/lib/config";
import { formatWon } from "@/lib/config";
import { daysLeft, fmtMD, fmtMDHM } from "./format";
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
  /** 품목 실사진. local 이면 /public 정적 파일(next/image 최적화), 아니면 DB 사진 주소 */
  image: { src: string; local: boolean } | null;
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

/** 쿠폰 종류 꼬리표 — 영수증 쿠폰은 없음 */
function kindText(c: Pick<WalletCoupon, "kind">): string | null {
  return c.kind === "vip" ? "등급 쿠폰" : c.kind === "manual" ? "매장 쿠폰" : null;
}

/** 쿠폰 행 썸네일 — 품목 실사진(56px)이 있으면 사진, 없으면 매장 쿠폰 티켓 그림(64px) */
function CouponThumb({ c }: { c: WalletCoupon }) {
  if (c.image) return <Image src={c.image.src} alt="" width={56} height={56} sizes="56px" className="thumb" unoptimized={!c.image.local} />;
  return <Art name={`coupon-${c.store?.id ?? "joseon"}`} className={styles.ticket} sizes="64px" />;
}

/* 내 등급 — 등급명, 누적 금액, 다음 등급까지 얇은 막대 */
export function TierCard({ tierName, totalSpend, visitCount, nextName, remaining, progress }: { tierName: string; totalSpend: number; visitCount: number; nextName: string | null; remaining: number; progress: number }) {
  return (
    <section id="tier" className={`card-soft ${styles.tier}`} aria-labelledby="tier-title">
      <div className={styles.tierRow}>
        <div>
          <p id="tier-title" className="cap">내 등급</p>
          <p className={styles.tierName}>{tierName}</p>
        </div>
        <div className={styles.tierAmt}>
          <p className="cap">누적 {visitCount}회</p>
          <p className={`num ${styles.tierSum}`}>{formatWon(totalSpend)}</p>
        </div>
      </div>
      <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={nextName ? `${nextName}까지` : "가장 높은 등급"}>
        <span className={styles.fill} style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }} />
      </div>
      <p className="cap">{nextName ? `${nextName}까지 ${formatWon(remaining)} 남았어요. 세 집 금액이 합쳐져요.` : "가장 높은 등급이에요. 등급 쿠폰이 따로 들어와요."}</p>
    </section>
  );
}

/* 아직 안 고른 승인 영수증 */
export function PickableReceipts({ receipts }: { receipts: WalletReceipt[] }) {
  return (
    <section className={`wrap ${styles.sec}`} aria-labelledby="wallet-pick">
      <div className="section-h">
        <h2 id="wallet-pick" className="h2-event">아직 안 고른 영수증</h2>
      </div>
      <ul>
        {receipts.map((r) => (
          <li key={r.id} className="row">
            <div className="body">
              <p className="title">{r.store?.shortName ?? "매장"} {r.amount == null ? "" : formatWon(r.amount)}</p>
              <p className="sub">{fmtMDHM(r.receiptAt ?? r.createdAt)}{r.deadline ? ` · ${fmtMD(r.deadline)}까지 골라요` : ""}</p>
            </div>
            <Link href={`/pick/${r.id}`} className="btn btn-sm">고르기</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 쓸 수 있는 쿠폰 — 품목 사진(없으면 티켓) · 품목 · 코드 · 만료일 */
export function ActiveCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  const now = new Date();
  return (
    <ul>
      {coupons.map((c) => {
        const left = daysLeft(c.expiresAt, now);
        const kind = kindText(c);
        return (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={`row ${styles.link}`} data-store={c.store?.id}>
              <CouponThumb c={c} />
              <span className="body">
                <span className={`title ${styles.title}`}>{c.menuName}{kind && <span className="tag">{kind}</span>}</span>
                <span className={`sub ${styles.sub}`}>
                  {c.store?.shortName ?? "매장"} · <span className="mono">{c.code}</span> · {fmtMD(c.expiresAt)}까지{left <= 7 ? <span className={styles.soon}> · {Math.max(left, 0)}일 남음</span> : ""}
                </span>
              </span>
              <Chevron />
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
    <section className={`wrap ${styles.sec}`} aria-labelledby="wallet-pending">
      <div className="section-h">
        <h2 id="wallet-pending" className="h2-event">확인 중인 영수증</h2>
      </div>
      <ul>
        {receipts.map((r) => (
          <li key={r.id} className="row">
            <Art name="status-checking" className={styles.icon} sizes="40px" />
            <div className="body">
              <p className="title">{r.store ? `${r.store.shortName} 영수증` : "영수증"}</p>
              <p className="sub">{fmtMDHM(r.createdAt)} 올림</p>
            </div>
            <span className="status-wait">확인 중</span>
          </li>
        ))}
      </ul>
      <p className={`cap ${styles.note}`}>직원이 보고 있어요. 끝나면 여기서 바로 골라요.</p>
    </section>
  );
}

/* 지난 쿠폰: 사용 / 만료 / 취소 — 접어 둔다. 누르는 줄(summary) 자체가 44px 이상 */
export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <details id="wallet-past" className={`wrap ${styles.past}`}>
      <summary className={styles.pastSummary}>
        <span className="h2-event">지난 쿠폰 {coupons.length}장</span>
        <Chevron className={styles.pastChev} />
      </summary>
      <ul className={styles.pastList}>
        {coupons.map((c) => (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={`row ${styles.link} ${styles.dim}`} data-status={c.status}>
              <CouponThumb c={c} />
              <span className="body">
                <span className={`title ${styles.title}`}>{c.menuName}</span>
                <span className={`sub ${styles.sub}`}>
                  {c.store?.shortName ?? ""} · {c.status === "used" ? `${fmtMDHM(c.usedAt)} 사용` : c.status === "expired" ? `${fmtMD(c.expiresAt)} 만료` : "취소됨"}
                </span>
              </span>
              <Chevron />
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
      <Art name="empty-pocket" width={120} />
      <p className="cap">아직 쿠폰이 없어요. 영수증을 올리면 여기 담겨요.</p>
      <Link href="/verify" className="btn">영수증 올리기</Link>
    </div>
  );
}
