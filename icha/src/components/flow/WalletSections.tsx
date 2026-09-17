import Link from "next/link";
import type { CSSProperties } from "react";
import { PlaceButton } from "@/components/site/PlaceButton";
import type { PlaceSheetStore } from "@/components/site/PlaceSheet";
import { Piece } from "@/components/site/Poster";
import type { StoreId } from "@/lib/config";
import { daysLeft, fmtMD, fmtMDHM } from "./format";
import { DotLine, KitCut, StickerButton } from "./kit";
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

/* 받은 쿠폰 — 발급 매장 색 판이 붙은 종이 한 장씩, 키트 [어디서 쓸지 고르기](44px)로 사용 매장을 고르러 간다 */
export function RelayCards({ relays }: { relays: WalletRelay[] }) {
  return (
    <section className={styles.sec} aria-labelledby="wallet-relay">
      <div className="sec-h">
        <h2 id="wallet-relay" className="plate plate-blue">받은 쿠폰</h2>
      </div>
      <ul className={styles.relays}>
        {relays.map((r, i) => (
          <li key={r.id} className={`paper ${styles.relay}`} data-store={r.store.id} style={{ "--r": `${i % 2 ? 1 : -1}deg` } as CSSProperties}>
            <p className={styles.relayHead}><span className="plate plate-store plate-sm">{r.store.shortName}</span><span className={`disp ${styles.relayTitle}`}>발급 쿠폰</span></p>
            <p className={styles.relaySub}><DotLine items={[`사용 매장 ${r.giftNames.join("·")} 중 1곳`, `${fmtMD(r.deadline)}까지 선택`]} /></p>
            <StickerButton kind="pick" href={`/pick/${r.id}`} small suffix={` — ${r.store.shortName} 발급 쿠폰`}>어디서 쓸지 고르기</StickerButton>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 사용 가능 쿠폰 — 쿠폰 더미(번갈아 ±1.5° 기울여 14px 씩 겹쳐 쌓인다). 종이인지 네온인지는 키트 파일이 정한다(Ticket) */
export function ActiveCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  const now = new Date();
  return (
    <ul className={styles.stack}>
      {coupons.map((c, i) => {
        const left = daysLeft(c.expiresAt, now);
        return (
          <li key={c.id} className={styles.stackItem}>
            <Link href={`/coupons/${c.id}`} className={styles.ticketLink} aria-label={`${c.store?.shortName ?? "매장"} ${c.menuName} 쿠폰`}>
              <Ticket
                t={{ storeId: c.store?.id ?? "joseon", storeName: c.store?.shortName ?? "매장", menuName: c.menuName, code: c.code, expiresAt: c.expiresAt, image: c.image, kindLabel: kindText(c) }}
                rotate={i % 2 ? 1.5 : -1.5}
              />
              {left <= 7 && <span className={`stamp ${styles.soon}`}>{Math.max(left, 0)}일 남음</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* 지난 쿠폰: 사용 / 만료 / 취소 — 접어 둔다. 누르는 줄(summary)은 어두운 띠, 44px 이상.
   사용한 쿠폰: 표시는 키트 도장(stamp-used 96px, -12도) 하나뿐이고 사용 시각은 티켓의 조건 줄 자리에 글자로("9월 17일 08:58 사용"). 만료·취소는 키트 도장이 없어 CSS 도장 글자 */
export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <details id="wallet-past" className={styles.past}>
      <summary className={`${styles.strip} ${styles.pastSummary}`}>지난 쿠폰 {coupons.length}장 <span className={styles.pastArrow} aria-hidden="true">▾</span></summary>
      <ul className={styles.stack}>
        {coupons.map((c, i) => (
          <li key={c.id} className={styles.stackItem}>
            <Link href={`/coupons/${c.id}`} className={styles.ticketLink} aria-label={`${c.store?.shortName ?? ""} ${c.menuName} — ${c.status === "used" ? "사용 완료" : c.status === "expired" ? "기간 만료" : "취소"}`}>
              <Ticket
                t={{ storeId: c.store?.id ?? "joseon", storeName: c.store?.shortName ?? "매장", menuName: c.menuName, code: c.code, expiresAt: c.expiresAt, image: c.image, kindLabel: kindText(c), meta: c.status === "used" ? `${fmtMDHM(c.usedAt)} 사용` : null }}
                rotate={i % 2 ? 1.5 : -1.5}
                dim
              />
              {c.status === "used" ? (
                <KitCut name="stamp-used" width={96} className={styles.usedStamp} fallback={<span className={`stamp stamp-green ${styles.pastStamp}`}>{fmtMDHM(c.usedAt)} 사용</span>} />
              ) : (
                <span className={`stamp ${styles.pastStamp}`}>{c.status === "expired" ? `${fmtMD(c.expiresAt)} 만료` : "취소됨"}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* 아무것도 없을 때 — 키트의 빈 봉투(empty-wallet 160px, 그림자 없음; 없으면 포스터 메모 조각) 위에, 크림 종이 한 장(본문 글꼴), 초록 스티커(예약하기) 하나 */
export function EmptyWallet({ stores }: { stores: PlaceSheetStore[] }) {
  return (
    <div className={styles.empty}>
      <KitCut name="empty-wallet" width={160} className={styles.envelope} fallback={<Piece name="note-good" rotate={6} sizes="100px" className={styles.emptyNote} />} />
      <div className={`paper paper-l ${styles.emptyPaper}`}>
        <p className={`disp ${styles.emptyTitle}`}>받은 쿠폰이 없습니다</p>
        <p className={styles.emptyText}>계산 시 휴대폰 번호를 말씀하시면 쿠폰이 발급됩니다</p>
      </div>
      <PlaceButton stores={stores} className={styles.emptyBtn} />
    </div>
  );
}
