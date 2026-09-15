"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatWon } from "@/lib/config";
import { fmtDate } from "./format";
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
  /** 01/02/03 */
  no: string;
  shortName: string;
  name: string;
  drink: "막걸리" | "맥주" | "소주";
  headline: string;
  items: PickItem[];
};

type Selected = { store: PickStore; item: PickItem };

export function MenuPicker({ receiptId, stores, couponValidDays }: { receiptId: string; stores: PickStore[]; couponValidDays: number }) {
  const router = useRouter();
  const id = useId();
  const [tab, setTab] = useState<string>(stores[0]?.id ?? "");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssueApiOk["coupon"] | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selected) confirmRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    if (!issued) return;
    const t = setTimeout(() => router.push(`/coupons/${issued.id}`), 1700);
    return () => clearTimeout(t);
  }, [issued, router]);

  const current = stores.find((s) => s.id === tab) ?? stores[0];

  async function confirm() {
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
          res.status === 401 ? "로그인이 풀렸어요. 다시 로그인한 뒤 쿠폰함에서 이어서 고를 수 있어요."
          : (data && !data.ok && data.error) || "쿠폰을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
        setBusy(false);
        return;
      }
      setIssued(data.coupon);
    } catch {
      setError("연결이 끊겼어요. 신호를 확인하고 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  if (!current) return null;

  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="tablist" aria-label="쿠폰을 쓸 매장">
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
            <span className={styles.tabNo} aria-hidden="true">{s.no}</span>
            <span className={styles.tabName}>{s.shortName}</span>
            <span className={styles.tabDrink}>{s.drink}</span>
            <span className={`num ${styles.tabCount}`}>{s.items.length}</span>
          </button>
        ))}
      </div>

      {stores.map((s) => (
        <section
          key={s.id}
          role="tabpanel"
          id={`${id}-panel-${s.id}`}
          aria-labelledby={`${id}-tab-${s.id}`}
          hidden={s.id !== current.id}
          className={styles.panel}
        >
          <p className={styles.headline}>
            <b>{s.name}</b> · {s.headline}
          </p>
          {s.items.length === 0 ? (
            <p className={styles.empty}>이 매장은 아직 고를 수 있는 사이드가 등록되지 않았어요. 다른 매장에서 골라 주세요.</p>
          ) : !s.items.some((it) => it.image) ? (
            /* 사진이 하나도 없는 매장은 빈 사진 칸 대신 목록으로 */
            <ul className={styles.list}>
              {s.items.map((it) => {
                const on = selected?.item.id === it.id;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      className={`${styles.row} ${on ? styles.on : ""}`}
                      aria-pressed={on}
                      onClick={() => { setError(null); setSelected({ store: s, item: it }); }}
                    >
                      <span className={styles.rowFree}>무료</span>
                      <span className={styles.rowBody}>
                        <span className={styles.itemName}>{it.name}</span>
                        {it.description && <span className={styles.itemDesc}>{it.description}</span>}
                      </span>
                      <span className={styles.rowRight}>
                        {it.price != null && <span className={`num ${styles.itemPrice}`}>{formatWon(it.price)}</span>}
                        <span className={styles.rowCheck} aria-hidden="true">{on ? "선택" : ""}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className={styles.grid}>
              {s.items.map((it) => {
                const on = selected?.item.id === it.id;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      className={`${styles.item} ${on ? styles.on : ""}`}
                      aria-pressed={on}
                      onClick={() => { setError(null); setSelected({ store: s, item: it }); }}
                    >
                      <span className={styles.photo}>
                        {it.image?.kind === "static" ? (
                          <Image src={it.image.src} alt="" fill sizes="(min-width: 760px) 30vw, 46vw" />
                        ) : it.image?.kind === "db" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image.src} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.noPhoto} aria-hidden="true">{s.drink}</span>
                        )}
                        <span className={styles.free}>무료</span>
                      </span>
                      <span className={styles.itemBody}>
                        <span className={styles.itemName}>{it.name}</span>
                        {it.price != null && <span className={`num ${styles.itemPrice}`}>{formatWon(it.price)}</span>}
                        {it.description && <span className={styles.itemDesc}>{it.description}</span>}
                      </span>
                      <span className={styles.check} aria-hidden="true">{on ? "선택" : ""}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      {selected && !issued && (
        <div className={styles.sheetWrap} role="dialog" aria-modal="false" aria-labelledby={`${id}-sheet-title`}>
          <div className={`${styles.sheet} ${busy ? styles.sheetBusy : ""}`}>
            <p className="eyebrow">확인</p>
            <p id={`${id}-sheet-title`} className={styles.sheetTitle}>
              {selected.store.shortName} · <span className="gold">{selected.item.name}</span><br />무료 쿠폰을 받을게요.
            </p>
            <p className={styles.sheetNote}>영수증 한 장에 쿠폰 한 장이에요. 받은 뒤에는 메뉴를 바꿀 수 없고, 오늘부터 {couponValidDays}일 안에 써야 해요.</p>
            {error && <p className="error" role="alert">{error}</p>}
            <div className={styles.sheetActions}>
              <button ref={confirmRef} type="button" className="btn btn-lg btn-block" onClick={confirm} disabled={busy}>
                {busy ? "쿠폰 만드는 중" : "받을게요"}
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={() => setSelected(null)} disabled={busy}>다시 고를게요</button>
            </div>
          </div>
        </div>
      )}

      {issued && selected && (
        <div className={styles.issueWrap} role="status" aria-live="polite">
          <div className={styles.issueStub}>
            <p className={`mono ${styles.issueStubText}`}>발급 완료 · 잠시 후 쿠폰으로 이동해요</p>
          </div>
          <div className={styles.perf} aria-hidden="true" />
          <div className={styles.issued}>
            <div className={styles.issuedBand}>
              <span className={styles.issuedNo}>{selected.store.no}</span>
              <span>{selected.store.shortName}</span>
              <span className={styles.issuedKind}>무료 사이드</span>
            </div>
            <p className={styles.issuedName}>{issued.menuName}</p>
            <p className={`mono ${styles.issuedCode}`}>{issued.code}</p>
            <p className={`mono ${styles.issuedExp}`}>{fmtDate(issued.expiresAt)}까지</p>
          </div>
        </div>
      )}
    </div>
  );
}
