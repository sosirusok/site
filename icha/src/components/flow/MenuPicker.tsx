"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { Fx } from "@/components/art/Fx";
import { formatWon } from "@/lib/config";
import { fmtMD } from "./format";
import type { ApiFail, IssueApiOk } from "./types";
import styles from "./MenuPicker.module.css";

export type PickItem = { id: number; name: string; price: number | null; description: string | null };

export type PickStore = {
  id: "joseon" | "tokyo" | "wareureu";
  shortName: string;
  name: string;
  drink: "막걸리" | "맥주" | "소주";
  items: PickItem[];
};

type Selected = { store: PickStore; item: PickItem | null };

/** 봉투 크기(public/art/envelope.png — coupon-issued 의 아래 54%) */
const ENVELOPE = { src: "/art/envelope.png", width: 800, height: 298 };

export function MenuPicker({ receiptId, stores, couponValidDays }: { receiptId: string; stores: PickStore[]; couponValidDays: number }) {
  const router = useRouter();
  const id = useId();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssueApiOk["coupon"] | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const confirming = Boolean(selected?.item) && !issued;

  useEffect(() => {
    if (confirming) sheetRef.current?.focus();
  }, [confirming]);

  // 발급 연출을 잠깐 보여 준 뒤 쿠폰 화면으로
  useEffect(() => {
    if (!issued) return;
    const t = window.setTimeout(() => router.push(`/coupons/${issued.id}`), 1600);
    return () => window.clearTimeout(t);
  }, [issued, router]);

  function pickStore(store: PickStore) {
    setError(null);
    if (selected?.store.id === store.id && selected.item) { setSelected(null); return; }
    // 증정 품목이 하나면 바로 그걸로, 여럿이면 아래 목록에서 고른다
    setSelected({ store, item: store.items.length === 1 ? (store.items[0] ?? null) : null });
  }

  function pickItem(store: PickStore, item: PickItem) {
    setError(null);
    setSelected({ store, item });
  }

  async function issue() {
    if (!selected?.item || busy) return;
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
      setIssued(data.coupon);
    } catch {
      setError("연결이 끊겼어요. 통신 상태를 확인한 뒤 다시 눌러 주세요.");
      setBusy(false);
    }
  }

  /* 발급 연출: 고른 집 티켓이 봉투에서 나온 장면 */
  if (issued && selected) {
    const store = selected.store;
    return (
      <div className={styles.issued} aria-live="polite">
        <div className={styles.envScene} aria-hidden="true">
          <div className={styles.envTicket}>
            <Art name={`coupon-${store.id}`} sizes="(min-width: 760px) 380px, 72vw" />
          </div>
          <div className={styles.envelope}>
            <Image src={ENVELOPE.src} alt="" width={ENVELOPE.width} height={ENVELOPE.height} sizes="(min-width: 760px) 480px, 92vw" draggable={false} />
          </div>
          <span className={styles.envCheck}><Fx seq="check" width={64} /></span>
        </div>
        <p className="h2">쿠폰이 들어왔어요</p>
        <p className={styles.issuedText}>
          {store.shortName} {issued.menuName} 쿠폰이 쿠폰함에 들어갔어요. {fmtMD(issued.expiresAt)}까지 쓸 수 있어요. 잠시 뒤 쿠폰 화면으로 넘어가요.
        </p>
        <Link href={`/coupons/${issued.id}`} className="btn btn-lg">쿠폰 바로 보기</Link>
      </div>
    );
  }

  return (
    <div className={styles.root} data-confirming={confirming || undefined}>
      <div className={styles.tickets} role="radiogroup" aria-label="쿠폰을 받을 집">
        {stores.map((s) => {
          const on = selected?.store.id === s.id;
          const none = s.items.length === 0;
          return (
            <div key={s.id} className={styles.ticketWrap} data-store={s.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                aria-disabled={none || undefined}
                className={styles.ticket}
                onClick={() => !none && pickStore(s)}
              >
                <Art name={`coupon-${s.id}`} alt={`${s.shortName} ${s.drink} 무료 쿠폰`} sizes="(min-width: 760px) 480px, 92vw" />
                {on && (
                  <span className={styles.mark} aria-hidden="true">
                    <Art name="icon-ok" width={44} />
                  </span>
                )}
              </button>
              {none && <p className={styles.none}>{s.shortName}는 증정 품목을 정하는 중이에요. 다른 집을 골라 주세요.</p>}
              {on && s.items.length > 1 && (
                <ul className={styles.items} role="radiogroup" aria-label={`${s.shortName} 증정 품목`}>
                  {s.items.map((it) => {
                    const itemOn = selected?.item?.id === it.id;
                    return (
                      <li key={it.id}>
                        <button type="button" role="radio" aria-checked={itemOn} className={styles.item} onClick={() => pickItem(s, it)}>
                          <span className={styles.itemDot} aria-hidden="true" />
                          <span className={styles.itemName}>{it.name}</span>
                          <span className={styles.itemDots} aria-hidden="true" />
                          <span className={styles.itemPrice}>
                            {it.price != null && <s>{formatWon(it.price)}</s>} <b>무료</b>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {on && s.items.length > 1 && !selected?.item && <p className={styles.hint}>위에서 한 가지를 골라 주세요.</p>}
            </div>
          );
        })}
      </div>

      {/* 확인 시트 — 하단 고정, 탭바 위 */}
      {confirming && selected?.item && (
        <div ref={sheetRef} className={styles.sheet} role="dialog" aria-labelledby={`${id}-sheet`} tabIndex={-1}>
          <div className={styles.sheetRow}>
            <div className={styles.sheetArt} aria-hidden="true">
              <Art name={`coupon-${selected.store.id}`} sizes="140px" />
            </div>
            <div className={styles.sheetText}>
              <p className={styles.sheetStore}>{selected.store.name}</p>
              <p id={`${id}-sheet`} className={styles.sheetItem}>
                <b data-store={selected.store.id}>{selected.item.name}</b> 무료 증정
              </p>
            </div>
          </div>
          <p className={styles.sheetNote}>영수증 한 장에 쿠폰 한 장이고, 받은 뒤에는 바꿀 수 없어요. 받은 날부터 {couponValidDays}일 동안 써요.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <div className={styles.sheetActions}>
            <button type="button" className="btn btn-outline" onClick={() => setSelected(null)} disabled={busy}>취소</button>
            <ArtButton kind="get-coupon" onClick={issue} loading={busy} width={220} />
          </div>
        </div>
      )}
    </div>
  );
}
