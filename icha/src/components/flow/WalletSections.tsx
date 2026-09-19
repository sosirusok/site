import Link from "next/link";
import { PlaceButton } from "@/components/site/PlaceButton";
import type { PlaceSheetStore } from "@/components/site/PlaceSheet";
import { Button } from "@/components/ui/Button";
import type { StoreId } from "@/lib/config";
import { daysLeft, fmtMD, fmtMDHM } from "./format";
import { DotLine } from "./kit";
import { Ticket } from "./Ticket";
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

/** 계산할 때 받은 릴레이 쿠폰 — 아직 어느 매장에서 쓸지 안 고른 것 */
export type WalletRelay = {
  id: string;
  /** 넣어 준 매장 */
  store: StoreRef;
  /** 쓸 수 있는 매장 이름들 */
  giftNames: string[];
  /** 고를 수 있는 마지막 날 */
  deadline: string;
};

/** 쿠폰 종류 꼬리표 — 계산할 때 받은 쿠폰은 없음, 매장이 따로 넣어 준 쿠폰만 */
function kindText(c: Pick<WalletCoupon, "kind">): string | null {
  return c.kind === "side" ? null : "매장 쿠폰";
}

/* 받은 쿠폰 — 카드 한 장씩(발급 매장 배지 · 안내 · [사용 매장 선택하기]) */
export function RelayCards({ relays }: { relays: WalletRelay[] }) {
  return (
    <section className={styles.sec} aria-labelledby="wallet-relay">
      <div className={styles.head}>
        <h2 id="wallet-relay" className="h3">받은 쿠폰 <span className={styles.count}>{relays.length}</span></h2>
        <p className="small muted">사용할 매장을 먼저 선택해 주세요</p>
      </div>
      <ul className={styles.relays}>
        {relays.map((r) => (
          <li key={r.id} className={`card card-pad ${styles.relay}`} data-store={r.store.id}>
            <p className={styles.relayHead}><span className="badge badge-store">{r.store.shortName}</span><span className={styles.relayTitle}>발급 쿠폰</span></p>
            <p className={`small muted ${styles.relaySub}`}><DotLine items={[`사용 매장 ${r.giftNames.join("·")} 중 1곳`, `${fmtMD(r.deadline)}까지 선택`]} /></p>
            <Button href={`/pick/${r.id}`} variant="primary" block srSuffix={` — ${r.store.shortName} 발급 쿠폰`}>사용 매장 선택하기</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 사용 가능 쿠폰 — 카드 목록. 7일 이내면 "N일 남음" 배지 */
export function ActiveCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  const now = new Date();
  return (
    <ul className={styles.stack}>
      {coupons.map((c) => {
        const left = daysLeft(c.expiresAt, now);
        return (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={styles.ticketLink} aria-label={`${c.store?.shortName ?? "매장"} ${c.menuName} 쿠폰`}>
              <Ticket
                t={{ storeId: c.store?.id ?? "joseon", storeName: c.store?.shortName ?? "매장", menuName: c.menuName, code: c.code, expiresAt: c.expiresAt, image: c.image, kindLabel: kindText(c) }}
                stamp={left <= 7 ? `${Math.max(left, 0)}일 남음` : null}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* 지난 쿠폰: 사용 / 만료 / 취소 — 접어 둔다 */
export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <details id="wallet-past" className={styles.past}>
      <summary className={styles.pastSummary}>
        <span>지난 쿠폰 {coupons.length}장</span>
        <svg className={styles.pastIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
      </summary>
      <ul className={styles.stack}>
        {coupons.map((c) => (
          <li key={c.id}>
            <Link href={`/coupons/${c.id}`} className={styles.ticketLink} aria-label={`${c.store?.shortName ?? ""} ${c.menuName} — ${c.status === "used" ? "사용 완료" : c.status === "expired" ? "기간 만료" : "취소"}`}>
              <Ticket
                t={{ storeId: c.store?.id ?? "joseon", storeName: c.store?.shortName ?? "매장", menuName: c.menuName, code: c.code, expiresAt: c.expiresAt, image: c.image, kindLabel: kindText(c), meta: c.status === "used" ? `${fmtMDHM(c.usedAt)} 사용` : c.status === "expired" ? `${fmtMD(c.expiresAt)} 만료` : "매장에서 취소" }}
                dim
                stamp={c.status === "used" ? "사용 완료" : c.status === "expired" ? "기간 만료" : "취소"}
              />
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* 아무것도 없을 때 — 아이콘, 제목, 설명, [예약하기] */
export function EmptyWallet({ stores }: { stores: PlaceSheetStore[] }) {
  return (
    <div className={`card ${styles.empty}`}>
      <span className={styles.emptyIcon} aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM9 6v12" /></svg>
      </span>
      <p className="h3">받은 쿠폰이 없습니다</p>
      <p className="small muted">계산 시 직원에게 휴대폰 번호를 말씀하시면 이 번호로 쿠폰이 발급됩니다.</p>
      <PlaceButton stores={stores} variant="naver" className={styles.emptyBtn}>매장 예약하기</PlaceButton>
    </div>
  );
}
