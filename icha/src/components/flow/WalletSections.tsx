import Link from "next/link";
import type { CSSProperties } from "react";
import { PlaceButton } from "@/components/site/PlaceButton";
import type { PlaceSheetStore } from "@/components/site/PlaceSheet";
import { Piece } from "@/components/site/Poster";
import type { StoreId } from "@/lib/config";
import { daysLeft, fmtMD, fmtMDHM } from "./format";
import { PaperTicket } from "./PaperTicket";
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

/* 받은 쿠폰 — 넣어 준 매장 색 판이 붙은 종이 한 장씩, 노란 스티커로 고르러 간다 */
export function RelayCards({ relays }: { relays: WalletRelay[] }) {
  return (
    <section className={styles.sec} aria-labelledby="wallet-relay">
      <div className="sec-h">
        <h2 id="wallet-relay" className="plate plate-blue">받은 쿠폰</h2>
        <p className={`hand hand-w ${styles.lead}`}>어디서 쓸지 골라요</p>
      </div>
      <ul className={styles.relays}>
        {relays.map((r, i) => (
          <li key={r.id} className={`paper ${styles.relay}`} data-store={r.store.id} style={{ "--r": `${i % 2 ? 1 : -1}deg` } as CSSProperties}>
            <p className={styles.relayHead}><span className="plate plate-store plate-sm">{r.store.shortName}</span><span className={`disp ${styles.relayTitle}`}>에서 받은 쿠폰</span></p>
            <p className={styles.relaySub}>{r.giftNames.join("·")} 중 한 곳에서 써요 · {fmtMD(r.deadline)}까지</p>
            <Link href={`/pick/${r.id}`} className="btn btn-sm">어디서 쓸지 고르기</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 쓸 수 있는 쿠폰 — 종이 쿠폰 더미(번갈아 기울여 쌓인다) */
export function ActiveCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  const now = new Date();
  return (
    <ul className={styles.stack}>
      {coupons.map((c, i) => {
        const left = daysLeft(c.expiresAt, now);
        return (
          <li key={c.id} className={styles.stackItem}>
            <Link href={`/coupons/${c.id}`} className={styles.ticketLink} aria-label={`${c.store?.shortName ?? "매장"} ${c.menuName} 쿠폰 보기`}>
              <PaperTicket
                t={{ storeId: c.store?.id ?? "joseon", storeName: c.store?.shortName ?? "매장", menuName: c.menuName, code: c.code, expiresAt: c.expiresAt, image: c.image, kindLabel: kindText(c) }}
                rotate={i % 2 ? 1 : -1}
              />
              {left <= 7 && <span className={`stamp ${styles.soon}`}>{Math.max(left, 0)}일 남음</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* 지난 쿠폰: 사용 / 만료 / 취소 — 접어 둔다. 누르는 줄(summary) 자체가 44px 이상 */
export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <details id="wallet-past" className={styles.past}>
      <summary className={`hand hand-w ${styles.pastSummary}`}>지난 쿠폰 {coupons.length}장 <span className={styles.pastArrow} aria-hidden="true">▾</span></summary>
      <ul className={styles.stack}>
        {coupons.map((c, i) => (
          <li key={c.id} className={styles.stackItem}>
            <Link href={`/coupons/${c.id}`} className={styles.ticketLink} aria-label={`${c.store?.shortName ?? ""} ${c.menuName} — ${c.status === "used" ? "사용한 쿠폰" : c.status === "expired" ? "기간이 지난 쿠폰" : "취소된 쿠폰"}`}>
              <PaperTicket
                t={{ storeId: c.store?.id ?? "joseon", storeName: c.store?.shortName ?? "매장", menuName: c.menuName, code: c.code, expiresAt: c.expiresAt, image: c.image, kindLabel: kindText(c) }}
                rotate={i % 2 ? 1 : -1}
                dim
              />
              <span className={`stamp ${c.status === "used" ? "stamp-green" : ""} ${styles.pastStamp}`}>
                {c.status === "used" ? `${fmtMDHM(c.usedAt)} 사용` : c.status === "expired" ? `${fmtMD(c.expiresAt)} 만료` : "취소됨"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* 아무것도 없을 때 — 종이 메모 한 장과 초록 스티커(예약하기) 하나 */
export function EmptyWallet({ stores }: { stores: PlaceSheetStore[] }) {
  return (
    <div className={styles.empty}>
      <div className={`scrap ${styles.emptyScrap}`} style={{ "--r": "-1.5deg" } as CSSProperties}>
        <div className="scrap-in">
          <p className={`hand ${styles.emptyTitle}`}>아직 쿠폰이 없어요</p>
          <p className={styles.emptyText}>한 매장에서 계산할 때 휴대폰 번호를 말해 주세요. 여기로 들어와요.</p>
        </div>
      </div>
      <Piece name="note-good" rotate={6} sizes="100px" className={styles.emptyNote} />
      <PlaceButton stores={stores} className={`btn btn-naver btn-block ${styles.emptyBtn}`}>예약하기</PlaceButton>
    </div>
  );
}
