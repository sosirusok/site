import Image from "next/image";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { PlaceButton } from "@/components/site/PlaceButton";
import type { PlaceSheetStore } from "@/components/site/PlaceSheet";
import { Chevron } from "@/components/ui/Chevron";
import type { StoreId } from "@/lib/config";
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

/** 쿠폰 행 썸네일 — 품목 실사진(56px)이 있으면 사진, 없으면 매장 쿠폰 티켓 그림 */
function CouponThumb({ c }: { c: WalletCoupon }) {
  if (c.image) return <Image src={c.image.src} alt="" width={56} height={56} sizes="56px" className="thumb" unoptimized={!c.image.local} />;
  return <Art name={`coupon-${c.store?.id ?? "joseon"}`} className={styles.ticket} sizes="56px" />;
}

/* 받은 쿠폰 — 넣어 준 매장 색 네온 카드 한 장씩 */
export function RelayCards({ relays }: { relays: WalletRelay[] }) {
  return (
    <section className={`wrap ${styles.sec}`} aria-labelledby="wallet-relay">
      <div className="section-h">
        <h2 id="wallet-relay" className="h2-event">받은 쿠폰</h2>
      </div>
      <ul className={styles.relays}>
        {relays.map((r) => (
          <li key={r.id} className={`card-neon ${styles.relay}`} data-store={r.store.id}>
            <p className={`h2-event neon ${styles.relayTitle}`}>{r.store.shortName}에서 받은 쿠폰</p>
            <p className="cap">{r.giftNames.join("·")} 중 한 곳에서 써요 · {fmtMD(r.deadline)}까지</p>
            <Link href={`/pick/${r.id}`} className="btn btn-sm">어디서 쓸지 고르기</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* 쓸 수 있는 쿠폰 — 품목 사진(없으면 티켓) · 품목 · 매장 · 코드 · 만료일 */
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
                  <span className={styles.storeName}>{c.store?.shortName ?? "매장"}</span> · <span className="mono">{c.code}</span> · {fmtMD(c.expiresAt)}까지{left <= 7 ? <span className={styles.soon}> · {Math.max(left, 0)}일 남음</span> : ""}
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

/* 아무것도 없을 때 — 빈 주머니, 한 줄 안내, 플레이스 버튼(매장 보기) */
export function EmptyWallet({ stores }: { stores: PlaceSheetStore[] }) {
  return (
    <div className={styles.empty}>
      <Art name="empty-pocket" width={120} />
      <p className={`h2-event ${styles.emptyTitle}`}>아직 쿠폰이 없어요</p>
      <p className="cap">한 매장에서 계산할 때 휴대폰 번호를 말해 주세요. 여기로 들어와요.</p>
      <PlaceButton stores={stores} className={`btn btn-naver btn-block ${styles.emptyBtn}`}>네이버 플레이스에서 매장 보기</PlaceButton>
    </div>
  );
}
