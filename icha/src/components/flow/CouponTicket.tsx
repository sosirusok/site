"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { daysLeft, fmtDate, fmtDateTimeSec, fmtTime } from "./format";
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
};

const KIND_LABEL: Record<TicketCoupon["kind"], string> = { side: "영수증 인증 쿠폰", vip: "등급 혜택 쿠폰", manual: "매장 발급 쿠폰" };
/** 이 시간 안에 사용한 쿠폰만 '방금 사용' 화면(시계)을 보여 준다 */
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
    <p className={styles.clock} role="timer" aria-live="off">
      <span className={styles.clockLabel}>현재 시각</span>
      <span className={`mono ${styles.clockTime}`}>{now ? fmtTime(now) : "--:--:--"}</span>
      <span className={`mono ${styles.clockDate}`}>{now ? fmtDate(now) : ""}</span>
    </p>
  );
}

export function CouponTicket({ coupon, store }: { coupon: TicketCoupon; store: TicketStore }) {
  const id = useId();
  const [status, setStatus] = useState(coupon.status);
  const [usedAt, setUsedAt] = useState(coupon.usedAt);
  const [justUsed, setJustUsed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

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
        return;
      }
      const msg = (data && !data.ok && data.error) || (res.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주십시오." : "사용 처리를 하지 못했습니다. 직원에게 쿠폰 코드를 보여 주십시오.");
      setError(msg);
      if (/이미 사용/.test(msg)) setStatus("used");
      else if (/기간이 지난/.test(msg)) setStatus("expired");
      else if (/취소된/.test(msg)) setStatus("void");
    } catch {
      setError("연결이 끊겨 처리하지 못했습니다. 통신 상태를 확인한 뒤 다시 시도해 주십시오.");
    } finally {
      setBusy(false);
    }
  }

  const left = daysLeft(coupon.expiresAt);
  const usedMs = usedAt ? Date.now() - new Date(usedAt).getTime() : Number.POSITIVE_INFINITY;
  const fresh = justUsed || usedMs < FRESH_MS;

  /* 방금 사용한 쿠폰: 검정 바탕 화면 + 현재 시각 */
  if (status === "used" && fresh) {
    return (
      <section className={styles.used} aria-live="polite">
        <p className={styles.usedTitle}>사용 완료</p>
        <LiveClock />
        <dl className={styles.usedRows}>
          <div><dt>사용 시각</dt><dd className="mono">{usedAt ? fmtDateTimeSec(usedAt) : "방금"}</dd></div>
          <div><dt>메뉴</dt><dd>{coupon.menuName}</dd></div>
          <div><dt>매장</dt><dd>{store.name}</dd></div>
          <div><dt>쿠폰 코드</dt><dd className="mono">{coupon.code}</dd></div>
        </dl>
        <p className={styles.usedNote}>이 화면의 현재 시각이 실제 시각과 같아야 방금 사용한 쿠폰입니다. 캡처한 화면은 시각이 멈추어 있으므로 인정하지 않습니다.</p>
        <Link href="/wallet" className="btn btn-light">쿠폰함으로</Link>
      </section>
    );
  }

  const inactive = status !== "active";

  return (
    <article className={styles.ticket} data-status={status}>
      <header className={styles.band}>
        <span className={styles.bandName}>{store.name}</span>
        <span className={styles.bandKind}>{KIND_LABEL[coupon.kind]}</span>
      </header>

      <div className={styles.body}>
        <p className={styles.free}>무료 사이드 메뉴</p>
        <h1 className={styles.menu}>{coupon.menuName}</h1>

        <dl className={`dl ${styles.rows}`}>
          <dt>사용 매장</dt>
          <dd>{store.name}<br /><span className={styles.addr}>{store.address}</span></dd>
          <dt>유효기간</dt>
          <dd className="mono">
            {fmtDate(coupon.expiresAt)}까지
            {status === "active" && left <= 7 && <span className={styles.left}> ({Math.max(left, 0)}일 남음)</span>}
          </dd>
          <dt>발급일</dt>
          <dd className="mono">{fmtDate(coupon.issuedAt)}</dd>
          {coupon.note && coupon.kind !== "side" && (
            <>
              <dt>비고</dt>
              <dd>{coupon.note}</dd>
            </>
          )}
        </dl>

        <div className={styles.codeBlock}>
          <p className={styles.codeLabel}>쿠폰 코드</p>
          <p className={`mono ${styles.code}`} aria-label={`쿠폰 코드 ${coupon.code.split("").join(" ")}`}>{coupon.code}</p>
          <p className={styles.codeHelp}>직원이 관리자 화면에서 코드로 확인할 수 있습니다.</p>
        </div>

        {inactive && (
          <div className={styles.inactive}>
            <p><span className="status status-no">{status === "used" ? "사용 완료" : status === "expired" ? "만료" : "취소"}</span></p>
            <p className={styles.inactiveText}>
              {status === "used"
                ? `${usedAt ? fmtDateTimeSec(usedAt) : "이전"}에 사용한 쿠폰입니다.`
                : status === "expired"
                  ? `${fmtDate(coupon.expiresAt)}에 유효기간이 지난 쿠폰입니다. 새 영수증을 인증하면 다시 받을 수 있습니다.`
                  : `매장에서 취소한 쿠폰입니다.${coupon.note ? ` (${coupon.note})` : ""} 문의는 매장 직원에게 해 주십시오.`}
            </p>
            {error && <p className="error" role="alert">{error}</p>}
            <Link href={status === "used" ? "/wallet" : "/verify"} className="btn btn-outline">{status === "used" ? "쿠폰함으로" : "영수증 인증"}</Link>
          </div>
        )}
      </div>

      {!inactive && (
        <div className={styles.use}>
          <p className={styles.show}>직원에게 이 화면을 보여 주십시오.</p>
          {confirming ? (
            <div className={styles.confirm} role="group" aria-labelledby={`${id}-confirm`}>
              <p id={`${id}-confirm`} className={styles.confirmTitle}>매장 직원이 확인했습니까?</p>
              <p className={styles.confirmText}>사용 처리 후 되돌릴 수 없습니다.</p>
              {error && <p className="error" role="alert">{error}</p>}
              <div className={styles.confirmActions}>
                <button ref={confirmRef} type="button" className="btn btn-red btn-lg" onClick={redeem} disabled={busy}>
                  {busy ? "처리 중" : "사용 처리"}
                </button>
                <button type="button" className="btn btn-outline btn-lg" onClick={() => { setConfirming(false); setError(null); }} disabled={busy}>취소</button>
              </div>
            </div>
          ) : (
            <>
              {error && <p className="error" role="alert">{error}</p>}
              <button type="button" className="btn btn-red btn-lg btn-block" onClick={() => setConfirming(true)}>사용 처리</button>
              <p className={styles.useHelp}>직원 확인 후 눌러 주십시오. 한 번 사용한 쿠폰은 다시 쓸 수 없습니다.</p>
            </>
          )}
        </div>
      )}
    </article>
  );
}
