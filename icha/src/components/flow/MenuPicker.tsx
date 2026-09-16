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
  items: PickItem[];
};

type Selected = { store: PickStore; item: PickItem };

function Thumb({ item }: { item: PickItem }) {
  if (!item.image) return null;
  return <Image src={item.image.src} alt="" width={56} height={56} sizes="56px" className="thumb" unoptimized={!item.image.local} />;
}

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
    if (!selected || busy) return;
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

  /* 발급 완료 */
  if (issued) {
    const { store, coupon } = issued;
    return (
      <div className={styles.issued} aria-live="polite">
        <Art name={`coupon-${store.id}`} alt={`${store.shortName} ${store.drink} 무료 쿠폰`} sizes="(min-width: 480px) 440px, 92vw" className={styles.issuedTicket} />
        <p className="h2">쿠폰이 들어왔어요</p>
        <p className="cap">{store.shortName} · {coupon.menuName} · {fmtMD(coupon.expiresAt)}까지</p>
        <Link href={`/coupons/${coupon.id}`} className="btn btn-block">쿠폰 보기</Link>
      </div>
    );
  }

  return (
    <div className={`has-sticky ${styles.root}`}>
      <div className={styles.cards} role="radiogroup" aria-label="쿠폰을 받을 집">
        {stores.map((s) => {
          const on = selected?.store.id === s.id;
          const none = s.items.length === 0;
          return (
            <div key={s.id} className={`card ${styles.card}`} data-on={on || undefined} data-store={s.id}>
              <div className={styles.cardHead}>
                <span className="dot" aria-hidden="true" />
                <p className="h3">{s.shortName}</p>
                <span className="cap">{s.drink}</span>
              </div>
              <Art name={`coupon-${s.id}`} alt="" sizes="(min-width: 480px) 400px, 84vw" className={styles.ticket} />
              {none ? (
                <p className="cap">받을 수 있는 품목을 정하는 중이에요. 다른 집을 골라 주세요.</p>
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
                          </span>
                          <span className={styles.price}>
                            {it.price != null && <span className="strike">{formatWon(it.price)}</span>}
                            <span className="tag tag-free">무료</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <p className="cap">영수증 한 장에 쿠폰 한 장이에요. 받은 뒤에는 바꿀 수 없고, {couponValidDays}일 동안 써요.</p>

      {/* 하단 고정 버튼(탭 위) */}
      <div className={`fixed-col sticky-cta ${styles.sticky}`}>
        {error && <p id={`${id}-err`} className="error" role="alert">{error}</p>}
        <button type="button" className="btn btn-block" onClick={issue} disabled={!selected || busy} aria-describedby={error ? `${id}-err` : undefined}>
          {busy ? "받는 중" : "이 쿠폰 받기"}
        </button>
      </div>
    </div>
  );
}
