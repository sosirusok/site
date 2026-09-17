"use client";
import Image from "next/image";
import { useId, useState, type CSSProperties } from "react";
import { KitPiece } from "@/components/site/Kit";
import { Piece, plateOf } from "@/components/site/Poster";
import { formatWon } from "@/lib/config";
import { fmtMD } from "./format";
import { DotLine, StickerButton } from "./kit";
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
  if (!item.image) return null;
  const cut = item.image.local && /\.png$/i.test(item.image.src);
  return <Image src={item.image.src} alt="" width={56} height={56} sizes="56px" className={cut ? styles.thumbCut : styles.thumb} unoptimized={!item.image.local} />;
}

/** 사용 매장 선택 — 매장마다 종이 한 장(키트 간판 230px + 품목 라디오(무료는 키트 도장 stamp-free 44px) + 초록 예약하기 하나), 아래 고정 크림 바의 [이 쿠폰 받기]. 발급되면 키트 티켓 한 장 + [쿠폰함 열기] + [예약하기]. */
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

  /* 발급 완료 — 쿠폰 한 장, 초록 간판 한 줄, 어두운 띠에 매장·품목·기한, 쿠폰 보기(노랑) + 그 매장 예약하기(초록 하나) */
  if (issued) {
    const { store, item, coupon } = issued;
    return (
      <div className={styles.issued} aria-live="polite" data-store={store.id}>
        <span className={`stamp stamp-green ${styles.issuedStamp}`}>발급 완료</span>
        <Ticket t={{ storeId: store.id, storeName: store.shortName, menuName: coupon.menuName, code: coupon.code, expiresAt: coupon.expiresAt, image: item.image }} size="lg" rotate={-1.5} />
        <h2 className={`plate plate-green ${styles.issuedTitle}`}>쿠폰이 발급되었습니다</h2>
        <p className={`${styles.strip} ${styles.issuedSub}`}><DotLine items={[store.shortName, coupon.menuName, `유효기간 ${fmtMD(coupon.expiresAt)}까지`]} /></p>
        <div className={styles.issuedBtns}>
          <StickerButton kind="wallet" href="/wallet" block>쿠폰함 열기</StickerButton>
          {store.placeBooking && <StickerButton kind="book" href={store.placeBooking} block suffix={` — ${store.shortName}`}>예약하기</StickerButton>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.cards} role="radiogroup" aria-label="사용 매장 선택">
        {stores.map((s, i) => {
          const on = selected?.store.id === s.id;
          const none = s.items.length === 0;
          return (
            <div key={s.id} className={`paper ${styles.card}`} data-on={on || undefined} data-store={s.id} style={{ "--r": `${i % 2 ? 1 : -1}deg` } as CSSProperties}>
              <div className={styles.cardHead}>
                <Piece name={plateOf(s.id)} rotate={i % 2 ? 2 : -2} sizes="220px" className={styles.plate} priority={i === 0} />
                <span className="sr-only">{s.course.n}차 {s.shortName}</span>
              </div>
              {none ? (
                <p className={styles.none}>혜택 준비 중입니다. 다른 매장을 선택해 주세요.</p>
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
                          <KitPiece name="stamp-free" bare sizes="44px" className={styles.freeStamp} fallback={<span className="tag tag-free">무료</span>} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {s.placeBooking && (
                <StickerButton kind="book" href={s.placeBooking} small className={styles.book} suffix={` — ${s.shortName}`}>예약하기</StickerButton>
              )}
            </div>
          );
        })}
      </div>
      <p className={`${styles.strip} ${styles.note}`}><DotLine items={["쿠폰 1장당 매장 1곳", "발급 후 변경 불가", `유효기간 ${couponValidDays}일`]} /></p>

      {/* 아래 고정 크림 바(탭 위) — 키트 [이 쿠폰 받기] 64px. 고른 매장 이름은 읽히는 이름 뒤에 */}
      <div className="fixed-col sticky-bar">
        {error && <p id={`${id}-err`} className={`error ${styles.err}`} role="alert">{error}</p>}
        <StickerButton kind="get" block onClick={issue} disabled={busy} srText={busy ? "발급 중" : undefined} suffix={selected ? ` — ${selected.store.shortName}` : ""}>
          {busy ? "발급 중" : selected ? `${selected.store.shortName} 쿠폰 발급` : "쿠폰 발급"}
        </StickerButton>
      </div>
    </div>
  );
}
