"use client";
import Image from "next/image";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatWon } from "@/lib/config";
import { fmtMD } from "./format";
import { DotLine } from "./kit";
import { Ticket } from "./Ticket";
import type { ApiFail, IssueApiOk } from "./types";
import styles from "./MenuPicker.module.css";

export type PickItem = {
  id: number;
  name: string;
  price: number | null;
  description: string | null;
  /** 메뉴 사진. local 이면 /public 정적 파일(next/image 최적화), 아니면 DB 사진 주소 */
  image: { src: string; local: boolean } | null;
};

export type PickStore = {
  id: "joseon" | "tokyo" | "wareureu";
  shortName: string;
  name: string;
  drink: "막걸리" | "맥주" | "소주";
  /** 포스터 순서(1차·2차·3차)와 한 마디 */
  course: { n: 1 | 2 | 3; line: string };
  /** 네이버 플레이스 홈(없으면 null) */
  placeHome: string | null;
  /** 네이버 예약(없으면 null) */
  placeBooking: string | null;
  items: PickItem[];
};

type Selected = { store: PickStore; item: PickItem };

function Thumb({ item }: { item: PickItem }) {
  if (!item.image) return <span className={styles.thumbEmpty} aria-hidden="true" />;
  const cut = item.image.local && /\.png$/i.test(item.image.src);
  return <Image src={item.image.src} alt="" width={56} height={56} sizes="56px" className={cut ? styles.thumbCut : styles.thumb} unoptimized={!item.image.local} />;
}

/** 사용 매장 선택 — 매장마다 카드(차수 배지 · 상호 · 품목 라디오 줄 · [예약하기]), 아래 고정 바의 [쿠폰 발급]. 발급되면 쿠폰 카드 + [쿠폰함 열기] + [예약하기]. */
export function MenuPicker({ receiptId, stores, couponValidDays }: { receiptId: string; stores: PickStore[]; couponValidDays: number }) {
  const id = useId();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ store: PickStore; item: PickItem; coupon: IssueApiOk["coupon"] } | null>(null);

  function pick(store: PickStore, item: PickItem) {
    setError(null);
    setSelected(selected?.item.id === item.id ? null : { store, item });
  }

  async function issue() {
    if (busy) return;
    if (!selected) {
      setError("사용할 매장과 혜택을 선택해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons/issue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ receiptId, menuItemId: selected.item.id }),
      });
      const data = (await res.json().catch(() => null)) as IssueApiOk | ApiFail | null;
      if (!res.ok || !data || !data.ok) {
        setError(
          res.status === 401
            ? "로그인이 만료되었습니다. 다시 로그인 후 쿠폰함에서 선택해 주세요."
            : (data && !data.ok && data.error) || "쿠폰 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
        setBusy(false);
        return;
      }
      setIssued({ store: selected.store, item: selected.item, coupon: data.coupon });
      window.scrollTo(0, 0);
    } catch {
      setError("네트워크 연결을 확인해 주세요.");
      setBusy(false);
    }
  }

  /* 발급 완료 — 확인 표시, 쿠폰 카드, 매장·품목·기한, [쿠폰함 열기] + 그 매장 [예약하기] */
  if (issued) {
    const { store, item, coupon } = issued;
    return (
      <div className={styles.issued} aria-live="polite" data-store={store.id}>
        <span className={styles.check} aria-hidden="true">
          <span aria-hidden="true">OK</span>
        </span>
        <h2 className="h2">쿠폰이 발급되었습니다</h2>
        <p className="lead"><DotLine items={[store.shortName, coupon.menuName, `유효기간 ${fmtMD(coupon.expiresAt)}까지`]} /></p>
        <Ticket t={{ storeId: store.id, storeName: store.shortName, menuName: coupon.menuName, code: coupon.code, expiresAt: coupon.expiresAt, image: item.image }} size="lg" className={styles.issuedTicket} />
        <div className={styles.issuedBtns}>
          <Button href="/wallet" variant="primary" size="lg" block>쿠폰함 열기</Button>
          {store.placeBooking && <Button href={store.placeBooking} variant="naver" size="lg" block srSuffix={` — ${store.shortName}`}>{store.shortName} 예약하기</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.cards} role="radiogroup" aria-label="사용 매장 선택">
        {stores.map((s) => {
          const on = selected?.store.id === s.id;
          const none = s.items.length === 0;
          return (
            <div key={s.id} className={`card ${styles.card}`} data-on={on || undefined} data-store={s.id}>
              <div className={styles.cardHead}>
                <span className="badge badge-store">{s.course.n}차</span>
                <span className={styles.storeName}>{s.shortName}</span>
                <span className="small muted">{s.drink}</span>
              </div>
              {none ? (
                <p className={`small muted ${styles.none}`}>혜택 준비 중입니다. 다른 매장을 선택해 주세요.</p>
              ) : (
                <ul className={styles.items}>
                  {s.items.map((it) => {
                    const itemOn = selected?.item.id === it.id;
                    return (
                      <li key={it.id}>
                        <button type="button" role="radio" aria-checked={itemOn} className={styles.item} onClick={() => pick(s, it)}>
                          <span className={styles.radio} aria-hidden="true" />
                          <Thumb item={it} />
                          <span className={styles.body}>
                            <span className={styles.name}>{it.name}</span>
                            {it.price != null && <span className={`small ${styles.price}`}><s className="strike num">{formatWon(it.price)}</s></span>}
                          </span>
                          <span className="badge badge-brand">무료</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {s.placeBooking && (
                <div className={styles.cardFoot}>
                  <Button href={s.placeBooking} variant="outline" size="sm" srSuffix={` — ${s.shortName}`}>네이버 예약</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ul className="notice" aria-label="안내">
        <li>쿠폰 1장당 매장 1곳 · 발급 후 변경 불가</li>
        <li>유효기간 {couponValidDays}일 · 메인안주 1개 주문 시 직원에게 제시</li>
      </ul>

      {/* 아래 고정 바(탭 위) — [쿠폰 발급]. 고른 매장 이름은 버튼 글자에 */}
      <div className="fixed-col sticky-bar">
        {error && <p id={`${id}-err`} className="error" role="alert">{error}</p>}
        <Button variant="primary" size="lg" block onClick={issue} disabled={busy} aria-busy={busy || undefined}>
          {busy ? "발급 중…" : selected ? `${selected.store.shortName} 쿠폰 발급` : "혜택을 선택해 주세요"}
        </Button>
      </div>
    </div>
  );
}
