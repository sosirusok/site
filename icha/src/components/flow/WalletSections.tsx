import Link from "next/link";
import { GiftLines } from "@/components/site/GiftLines";
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
  return null;
}

/* 받은 쿠폰 — 카드 한 장씩(발급 매장 배지 · 안내 · [사용 매장 선택하기]) */
export function RelayCards({ relays }: { relays: WalletRelay[] }) {
  return (
    <section className={styles.sec} aria-labelledby="wallet-relay">
      <div className={styles.head}>
        <h2 id="wallet-relay" className="h3">쓸 집 고르기 <span className={styles.count}>{relays.length}장</span></h2>
        <p className="small muted">사용할 매장을 먼저 선택해 주세요</p>
      </div>
      <ul className={styles.relays}>
        {/* 상자가 아니다 — 매장 색면 한 줄 아래 설명과 버튼. 쿠폰 표와 모양이 겹치면 둘 다 카드로 읽힌다 */}
        {relays.map((r) => (
          <li key={r.id} className={styles.relay} data-store={r.store.id}>
            <p className={styles.relayHead}>{r.store.shortName}에서 받음</p>
            <p className={styles.relaySub}><DotLine items={[`${r.giftNames.join("·")} 중 한 곳`, `${fmtMD(r.deadline)}까지`]} /></p>
            <Button href={`/pick/${r.id}`} variant="primary" block srSuffix={` — ${r.store.shortName}에서 받은 쿠폰`}>쓸 집 고르기</Button>
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

/* 다 쓴 쿠폰: 사용 / 만료 / 취소 — 접어 둔다 */
export function PastCoupons({ coupons }: { coupons: WalletCoupon[] }) {
  return (
    <details id="wallet-past" className={styles.past}>
      <summary className={styles.pastSummary}>
        <span>다 쓴 쿠폰 {coupons.length}장</span>
        <span className={styles.pastIcon} aria-hidden="true" />
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
    <div className={styles.empty}>
      {/* 가운데 정렬 아이콘·제목·설명·버튼 세트를 쓰지 않는다 — 어느 AI 템플릿에서나 나오는 빈 화면이다.
          대신 빈 표 자리를 그대로 보여 준다: 점선으로 뜯긴 자리에 "아직 없음" 한 마디. */}
      <p className={styles.emptySlot} aria-hidden="true">아직 없음</p>
      <p className={styles.emptyLine}>계산할 때 번호만 말씀하시면 이 번호로 쌓입니다.</p>
      <PlaceButton stores={stores} variant="naver" className={styles.emptyBtn}>매장 예약하기</PlaceButton>
      <GiftLines title="쿠폰으로 받으시는 혜택" />
    </div>
  );
}
