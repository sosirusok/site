"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatWon } from "@/lib/config";
import type { ApiFail, IssueApiOk } from "./types";
import styles from "./MenuPicker.module.css";

export type PickItem = {
  id: number;
  name: string;
  price: number | null;
  description: string | null;
  /** 정적 사진(/public) 은 next/image, DB 사진(/api/menu-image) 은 img */
  image: { kind: "static" | "db"; src: string } | null;
};

export type PickStore = {
  id: "joseon" | "tokyo" | "wareureu";
  shortName: string;
  name: string;
  items: PickItem[];
};

type Selected = { store: PickStore; item: PickItem };

export function MenuPicker({ receiptId, stores, couponValidDays }: { receiptId: string; stores: PickStore[]; couponValidDays: number }) {
  const router = useRouter();
  const id = useId();
  const [tab, setTab] = useState<string>(stores[0]?.id ?? "");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssueApiOk["coupon"] | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    if (issued) router.push(`/coupons/${issued.id}`);
  }, [issued, router]);

  const current = stores.find((s) => s.id === tab) ?? stores[0];

  function choose(store: PickStore, item: PickItem) {
    setError(null);
    setConfirming(false);
    setSelected((prev) => (prev?.item.id === item.id ? null : { store, item }));
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
          res.status === 401 ? "로그인이 만료되었습니다. 다시 로그인한 뒤 쿠폰함에서 이어서 선택할 수 있습니다."
          : (data && !data.ok && data.error) || "쿠폰을 발급하지 못했습니다. 잠시 후 다시 시도해 주십시오.",
        );
        setBusy(false);
        return;
      }
      setIssued(data.coupon);
    } catch {
      setError("연결이 끊겼습니다. 통신 상태를 확인한 뒤 다시 시도해 주십시오.");
      setBusy(false);
    }
  }

  if (!current) return null;

  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="tablist" aria-label="쿠폰을 사용할 매장">
        {stores.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`${id}-tab-${s.id}`}
            aria-selected={s.id === current.id}
            aria-controls={`${id}-panel-${s.id}`}
            className={styles.tab}
            onClick={() => setTab(s.id)}
          >
            {s.shortName} <span className={styles.tabCount}>{s.items.length}</span>
          </button>
        ))}
      </div>

      {stores.map((s) => {
        const withPhoto = s.items.filter((it) => it.image);
        const noPhoto = s.items.filter((it) => !it.image);
        return (
          <section
            key={s.id}
            role="tabpanel"
            id={`${id}-panel-${s.id}`}
            aria-labelledby={`${id}-tab-${s.id}`}
            hidden={s.id !== current.id}
            className={styles.panel}
          >
            <p className={styles.panelName}>{s.name}</p>
            {s.items.length === 0 && (
              <p className={styles.empty}>등록된 사이드 메뉴가 없습니다. 다른 매장을 선택해 주십시오.</p>
            )}
            {withPhoto.length > 0 && (
              <ul className={styles.grid}>
                {withPhoto.map((it) => {
                  const on = selected?.item.id === it.id;
                  return (
                    <li key={it.id}>
                      <button type="button" className={styles.item} aria-pressed={on} onClick={() => choose(s, it)}>
                        <span className={styles.photo}>
                          {it.image?.kind === "static" ? (
                            <Image src={it.image.src} alt="" fill sizes="(min-width: 760px) 280px, 45vw" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image?.src} alt="" loading="lazy" />
                          )}
                        </span>
                        <span className={styles.itemName}>{it.name}</span>
                        <span className={styles.itemPrice}>
                          {it.price != null && <s className="mono">{formatWon(it.price)}</s>}
                          <b className={styles.free}>무료</b>
                        </span>
                        {it.description && <span className={styles.itemDesc}>{it.description}</span>}
                        <span className={styles.itemMark} aria-hidden="true">{on ? "선택됨" : "선택"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {noPhoto.length > 0 && (
              <ul className={styles.list}>
                {noPhoto.map((it) => {
                  const on = selected?.item.id === it.id;
                  return (
                    <li key={it.id}>
                      <button type="button" className={styles.row} aria-pressed={on} onClick={() => choose(s, it)}>
                        <span className={styles.rowBody}>
                          <span className={styles.itemName}>{it.name}</span>
                          {it.description && <span className={styles.itemDesc}>{it.description}</span>}
                        </span>
                        <span className={styles.itemPrice}>
                          {it.price != null && <s className="mono">{formatWon(it.price)}</s>}
                          <b className={styles.free}>무료</b>
                        </span>
                        <span className={styles.itemMark} aria-hidden="true">{on ? "선택됨" : "선택"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <div className={styles.bar} aria-live="polite">
        {issued ? (
          <p className={styles.barText}>쿠폰이 발급되었습니다. 쿠폰 화면으로 이동합니다.</p>
        ) : !selected ? (
          <p className={styles.barText}>받을 메뉴를 하나 선택해 주십시오.</p>
        ) : confirming ? (
          <div className={styles.confirm} role="group" aria-labelledby={`${id}-confirm`}>
            <p id={`${id}-confirm`} className={styles.confirmTitle}>
              {selected.store.shortName} · {selected.item.name} 무료 쿠폰을 발급합니다.
            </p>
            <p className={styles.confirmText}>영수증 1장당 쿠폰 1장이 발급되며, 발급 후에는 메뉴를 바꿀 수 없습니다. 쿠폰은 발급일부터 {couponValidDays}일간 유효합니다.</p>
            {error && <p className="error" role="alert">{error}</p>}
            <div className={styles.confirmActions}>
              <button ref={confirmRef} type="button" className="btn btn-red btn-lg" onClick={issue} disabled={busy}>
                {busy ? "발급 중" : "발급"}
              </button>
              <button type="button" className="btn btn-outline btn-lg" onClick={() => setConfirming(false)} disabled={busy}>취소</button>
            </div>
          </div>
        ) : (
          <div className={styles.barRow}>
            <p className={styles.barPick}>
              <span className={styles.barStore}>{selected.store.shortName}</span>
              <b>{selected.item.name}</b>
            </p>
            <button type="button" className="btn btn-red" onClick={() => setConfirming(true)}>쿠폰 발급</button>
          </div>
        )}
      </div>
    </div>
  );
}
