"use client";
import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { Art } from "@/components/art/Art";
import { formatWon } from "@/lib/config";
import { fmtMD } from "./format";
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
  if (!item.image) return null;
  return <Image src={item.image.src} alt="" width={56} height={56} sizes="56px" className="thumb" unoptimized={!item.image.local} />;
}

/** 어디서 받을지 고르기 — 매장 네온 카드 두 장, 품목 라디오 행, 아래 고정 버튼. 받고 나면 티켓과 예약 버튼. */
export function MenuPicker({ receiptId, stores, couponValidDays }: { receiptId: string; stores: PickStore[]; couponValidDays: number }) {
  const id = useId();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ store: PickStore; coupon: IssueApiOk["coupon"] } | null>(null);

  function pick(store: PickStore, item: PickItem) {
    setError(null);
    setSelected(selected?.item.id === item.id ? null : { store, item });
  }

  async function issue() {
    if (busy) return;
    if (!selected) {
      setError("받을 곳을 먼저 골라 주세요.");
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
            ? "로그인이 풀렸어요. 다시 로그인하면 쿠폰함에서 이어서 고를 수 있어요."
            : (data && !data.ok && data.error) || "쿠폰을 만들지 못했어요. 잠시 뒤에 다시 눌러 주세요.",
        );
        setBusy(false);
        return;
      }
      setIssued({ store: selected.store, coupon: data.coupon });
      window.scrollTo(0, 0);
    } catch {
      setError("연결이 끊겼어요. 다시 눌러 주세요.");
      setBusy(false);
    }
  }

  /* 발급 완료 — 티켓 한 장, 제목 하나, 쿠폰 보기 + 그 매장 예약하기 */
  if (issued) {
    const { store, coupon } = issued;
    return (
      <div className={styles.issued} aria-live="polite" data-store={store.id}>
        <Art name={`coupon-${store.id}`} alt={`${store.shortName} ${coupon.menuName} 쿠폰`} sizes="(min-width: 480px) 440px, 92vw" className={styles.issuedTicket} />
        <h2 className="h1-event">쿠폰이 들어왔어요</h2>
        <p className="cap">{store.shortName} · {coupon.menuName} · {fmtMD(coupon.expiresAt)}까지</p>
        <div className={styles.issuedBtns}>
          <Link href={`/coupons/${coupon.id}`} className="btn btn-block">쿠폰 보기</Link>
          {store.placeBooking && <a href={store.placeBooking} target="_blank" rel="noreferrer" className="btn btn-naver btn-block">{store.shortName} 예약하기</a>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.cards} role="radiogroup" aria-label="쿠폰을 받을 매장">
        {stores.map((s) => {
          const on = selected?.store.id === s.id;
          const none = s.items.length === 0;
          return (
            <div key={s.id} className={`card-neon ${styles.card}`} data-on={on || undefined} data-store={s.id}>
              <div className={styles.cardHead}>
                <span className="tag tag-neon">{s.course.n}차</span>
                <p className={`h2-event neon ${styles.cardName}`}>{s.shortName}</p>
              </div>
              <p className={`cap ${styles.cardLine}`}>{s.course.line}</p>
              {none ? (
                <p className={`cap ${styles.none}`}>어떤 혜택을 드릴지 정하고 있어요. 다른 매장을 골라 주세요.</p>
              ) : (
                <ul className={styles.items}>
                  {s.items.map((it) => {
                    const itemOn = selected?.item.id === it.id;
                    return (
                      <li key={it.id}>
                        <button type="button" role="radio" aria-checked={itemOn} className={`row ${styles.item}`} onClick={() => pick(s, it)}>
                          <span className={styles.radio} aria-hidden="true" />
                          <Thumb item={it} />
                          <span className="body">
                            <span className={`title ${styles.name}`}>{it.name}</span>
                            {it.price != null && <span className={`sub ${styles.price}`}><span className="strike">{formatWon(it.price)}</span></span>}
                          </span>
                          <span className="tag tag-free">무료</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {s.placeBooking && (
                <a className={`btn btn-naver btn-sm btn-block ${styles.book}`} href={s.placeBooking} target="_blank" rel="noreferrer">예약하기<span className="sr-only"> — {s.shortName}</span></a>
              )}
            </div>
          );
        })}
      </div>
      <p className="cap">쿠폰 하나에 한 곳이에요. 받은 뒤에는 바꿀 수 없고, {couponValidDays}일 동안 써요.</p>

      {/* 하단 고정 버튼(탭 위) */}
      <div className={`fixed-col sticky-cta ${styles.sticky}`}>
        {error && <p id={`${id}-err`} className="error" role="alert">{error}</p>}
        <button type="button" className="btn btn-block" onClick={issue} disabled={busy} aria-describedby={error ? `${id}-err` : undefined}>
          {busy ? "받는 중" : selected ? `${selected.store.shortName}에서 받기` : "이 쿠폰 받기"}
        </button>
      </div>
    </div>
  );
}
