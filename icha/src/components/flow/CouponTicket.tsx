"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Art } from "@/components/art/Art";
import { daysLeft, fmtDate, fmtDateTimeSec, fmtMD, fmtMDHM, fmtTime } from "./format";
import type { ApiFail, RedeemApiOk } from "./types";
import styles from "./CouponTicket.module.css";

export type TicketCoupon = {
  id: string;
  code: string;
  menuName: string;
  status: "active" | "used" | "expired" | "void";
  kind: "side" | "vip" | "manual";
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
  note: string | null;
};

export type TicketStore = {
  id: "joseon" | "tokyo" | "wareureu";
  shortName: string;
  name: string;
  address: string;
  /** 대표 술 — 품목명에 이 말이 들어갈 때만 매장 쿠폰 티켓 그림을 쓴다 */
  drink?: string;
  /** 품목 사진(있으면 티켓 대신) */
  image?: string | null;
};

/** 이 시간 안에 사용한 쿠폰은 '방금 사용' 화면(흐르는 시계)을 보여 준다 */
const FRESH_MS = 3 * 60 * 1000;

/** 화면 캡처 재사용을 막는 현재 시각 — 마운트 뒤에만 그린다(서버와 불일치 방지) */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`card-soft ${styles.clock}`} role="timer" aria-live="off">
      <p className="cap">지금 시각</p>
      <p className={`h1 mono ${styles.clockTime}`}>{now ? fmtTime(now) : "--:--:--"}</p>
      <p className="cap">{now ? fmtDate(now) : ""}</p>
    </div>
  );
}

function kindText(c: Pick<TicketCoupon, "kind">): string | null {
  return c.kind === "vip" ? "등급 쿠폰" : c.kind === "manual" ? "매장 쿠폰" : null;
}

export function CouponTicket({ coupon, store }: { coupon: TicketCoupon; store: TicketStore }) {
  const id = useId();
  const [status, setStatus] = useState(coupon.status);
  const [usedAt, setUsedAt] = useState(coupon.usedAt);
  const [justUsed, setJustUsed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  // 확인 시트가 열려 있으면 Esc 로 닫고, 뒤 화면은 스크롤을 막는다
  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setConfirming(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [confirming, busy]);

  async function redeem() {
    if (busy || status !== "active") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/coupons/${coupon.id}/redeem`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as RedeemApiOk | ApiFail | null;
      if (res.ok && data && data.ok) {
        setUsedAt(data.coupon.usedAt ?? new Date().toISOString());
        setJustUsed(true);
        setStatus("used");
        setConfirming(false);
        window.scrollTo(0, 0);
        return;
      }
      const msg = (data && !data.ok && data.error) || (res.status === 401 ? "로그인이 풀렸어요. 다시 로그인해 주세요." : "사용 처리가 안 됐어요. 직원에게 코드를 보여 주세요.");
      setError(msg);
      if (/이미 사용/.test(msg)) setStatus("used");
      else if (/기간이 지난/.test(msg)) setStatus("expired");
      else if (/취소된/.test(msg)) setStatus("void");
    } catch {
      setError("연결이 끊겼어요. 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const left = daysLeft(coupon.expiresAt);
  const usedMs = usedAt ? Date.now() - new Date(usedAt).getTime() : Number.POSITIVE_INFINITY;
  const fresh = justUsed || usedMs < FRESH_MS;
  const kind = kindText(coupon);
  const drinkTicket = !store.drink || coupon.menuName.includes(store.drink);
  const ticket = drinkTicket ? (
    <Art name={`coupon-${store.id}`} alt={`${store.shortName} ${coupon.menuName} 무료 쿠폰`} sizes="(min-width: 480px) 440px, 92vw" priority className={styles.ticket} />
  ) : store.image ? (
    <img src={store.image} alt={`${store.shortName} ${coupon.menuName}`} className={styles.photo} />
  ) : (
    <div className={styles.plain} data-store={store.id}><span className="tag tag-store">{store.shortName}</span><b>{coupon.menuName}</b></div>
  );

  /* 사용한 쿠폰 */
  if (status === "used") {
    return (
      <article className={styles.root} data-status="used" aria-live="polite">
        <div className={styles.dim}>{ticket}</div>
        <div className={styles.state}>
          <p className="status-ok">사용 완료</p>
          <h1 className="h1-event">{fresh ? "잘 썼어요" : "이미 쓴 쿠폰이에요"}</h1>
        </div>
        {fresh && <LiveClock />}
        <div className="paper">
          <div className="row"><b>사용 시각</b><span className="val mono">{usedAt ? fmtDateTimeSec(usedAt) : "방금"}</span></div>
          <div className="row"><b>매장</b><span className="val">{store.shortName}</span></div>
          <div className="row"><b>품목</b><span className="val">{coupon.menuName}</span></div>
          <div className="row"><b>코드</b><span className="val mono">{coupon.code}</span></div>
        </div>
        {fresh && <p className="cap">직원은 위 시계가 지금 시각과 같은지만 봐 주세요. 캡처한 화면은 시계가 멈춰 있어요.</p>}
        <Link href="/wallet" className="btn btn-secondary btn-block">쿠폰함으로</Link>
      </article>
    );
  }

  if (status === "expired" || status === "void") {
    const expired = status === "expired";
    return (
      <article className={styles.root} data-status={status}>
        <div className={styles.dim}>{ticket}</div>
        <div className={styles.state}>
          <p className="status-no">{expired ? "기간 지남" : "취소됨"}</p>
          <h1 className="h1-event">{expired ? "기간이 지났어요" : "취소된 쿠폰이에요"}</h1>
          <p className="cap">
            {expired
              ? `${fmtMD(coupon.expiresAt)}까지 쓸 수 있었어요. 새 영수증을 올리면 다시 받아요.`
              : `매장에서 취소했어요.${coupon.note ? ` (${coupon.note})` : ""} 궁금한 점은 직원에게 물어봐 주세요.`}
          </p>
        </div>
        <div className="paper">
          <div className="row"><b>매장</b><span className="val">{store.shortName}</span></div>
          <div className="row"><b>품목</b><span className="val">{coupon.menuName}</span></div>
          <div className="row"><b>코드</b><span className="val mono">{coupon.code}</span></div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className={styles.actions}>
          {expired && <Link href="/verify" className="btn btn-block">영수증 올리기</Link>}
          <Link href="/wallet" className="btn btn-secondary btn-block">쿠폰함으로</Link>
        </div>
      </article>
    );
  }

  /* 쓸 수 있는 쿠폰 */
  return (
    <article className={styles.root} data-status="active">
      {ticket}

      <div className={styles.info}>
        <h1 className={`h1-event ${styles.name}`}>{coupon.menuName}{kind && <span className={`tag ${styles.kind}`}>{kind}</span>}</h1>
        <p className={styles.store}>{store.name}</p>
        <p className={`mono ${styles.code}`} aria-label={`쿠폰 코드 ${coupon.code.split("").join(" ")}`}>{coupon.code}</p>
        <p className={`cap ${styles.how}`}>메인안주 1개 주문 시 · 직원에게 보여 주세요</p>
        <p className="cap">
          {fmtMD(coupon.expiresAt)}까지{left <= 7 && <span className={styles.soon}> · {Math.max(left, 0)}일 남음</span>} · {fmtMDHM(coupon.issuedAt)}에 받음
        </p>
        {coupon.note && coupon.kind !== "side" && <p className="cap">{coupon.note}</p>}
      </div>

      <div className={styles.use}>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="button" className="btn btn-block" onClick={() => { setError(null); setConfirming(true); }}>직원 앞에서 사용하기</button>
        <p className="cap">직원이 확인한 뒤에 눌러 주세요. 한 번 쓰면 되돌릴 수 없어요.</p>
      </div>

      {confirming && (
        <div className={styles.overlay} onClick={() => !busy && setConfirming(false)}>
          <div className={`fixed-col ${styles.sheetCol}`}>
            <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={`${id}-confirm`} onClick={(e) => e.stopPropagation()}>
              <p id={`${id}-confirm`} className="h2">쿠폰을 지금 사용할까요?</p>
              <p className={styles.sheetSub}>{store.shortName} · {coupon.menuName} 무료</p>
              <p className="cap">직원이 보고 있을 때만 눌러 주세요. 되돌릴 수 없어요.</p>
              {error && <p className="error" role="alert">{error}</p>}
              <div className={styles.sheetBtns}>
                <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={() => setConfirming(false)} disabled={busy}>취소</button>
                <button type="button" className="btn" onClick={redeem} disabled={busy} aria-busy={busy}>{busy ? "잠시만요" : "사용하기"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
