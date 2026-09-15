"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Stamp } from "@/components/ui/Stamp";
import { daysLeft, fmtDate, fmtDateTime, fmtTime } from "./format";
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
  /** 01/02/03 */
  no: string;
  shortName: string;
  name: string;
  drink: "막걸리" | "맥주" | "소주";
  address: string;
};

const HOLD_MS = 1200;
const KIND_LABEL: Record<TicketCoupon["kind"], string> = { side: "영수증 인증 쿠폰", vip: "등급 혜택 쿠폰", manual: "매장 발급 쿠폰" };

/** 화면 캡처 재사용을 막는 실시간 시계 — 마운트 뒤에만 그린다(서버와 불일치 방지) */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={styles.clock} role="timer" aria-live="off">
      <p className={`mono ${styles.clockTime}`}>{now ? fmtTime(now) : "--:--:--"}</p>
      <p className={`mono ${styles.clockDate}`}>{now ? fmtDate(now) : ""} 지금 시각</p>
    </div>
  );
}

export function CouponTicket({ coupon, store }: { coupon: TicketCoupon; store: TicketStore }) {
  const [status, setStatus] = useState(coupon.status);
  const [usedAt, setUsedAt] = useState(coupon.usedAt);
  const [busy, setBusy] = useState(false);
  const [torn, setTorn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);

  const ticketRef = useRef<HTMLElement>(null);
  const tearRef = useRef<SVGPathElement>(null);
  const holdRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const pRef = useRef(0);

  const paint = useCallback((p: number) => {
    pRef.current = p;
    ticketRef.current?.style.setProperty("--p", p.toFixed(3));
    if (tearRef.current) tearRef.current.style.strokeDashoffset = (1 - p).toFixed(3);
  }, []);

  const complete = useCallback(async () => {
    holdRef.current = false;
    setHolding(false);
    paint(1);
    setTorn(true);
    try { navigator.vibrate?.(35); } catch { /* 지원 안 함 */ }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/coupons/${coupon.id}/redeem`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as RedeemApiOk | ApiFail | null;
      if (res.ok && data && data.ok) {
        setUsedAt(data.coupon.usedAt ?? new Date().toISOString());
        setStatus("used");
        return;
      }
      const msg = (data && !data.ok && data.error) || (res.status === 401 ? "로그인이 풀렸어요. 다시 로그인해 주세요." : "사용 처리를 하지 못했어요. 직원에게 코드를 보여 주세요.");
      setError(msg);
      setTorn(false);
      paint(0);
      if (/이미 사용/.test(msg)) setStatus("used");
      else if (/기간이 지난/.test(msg)) setStatus("expired");
      else if (/취소된/.test(msg)) setStatus("void");
    } catch {
      setError("연결이 끊겨 처리하지 못했어요. 신호를 확인하고 다시 눌러 주세요.");
      setTorn(false);
      paint(0);
    } finally {
      setBusy(false);
    }
  }, [coupon.id, paint]);

  const tick = useCallback(() => {
    if (!holdRef.current) return;
    const p = Math.min(1, (performance.now() - startRef.current) / HOLD_MS);
    paint(p);
    if (p >= 1) { void complete(); return; }
    rafRef.current = requestAnimationFrame(tick);
  }, [paint, complete]);

  const begin = useCallback(() => {
    if (status !== "active" || busy || torn || holdRef.current) return;
    setError(null);
    holdRef.current = true;
    setHolding(true);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [status, busy, torn, tick]);

  const cancel = useCallback(() => {
    if (!holdRef.current) return;
    holdRef.current = false;
    setHolding(false);
    cancelAnimationFrame(rafRef.current);
    // 손을 떼면 찢어지던 절취선이 되돌아간다
    const from = pRef.current;
    const t0 = performance.now();
    const back = () => {
      const k = Math.min(1, (performance.now() - t0) / 180);
      paint(from * (1 - k));
      if (k < 1 && !holdRef.current) rafRef.current = requestAnimationFrame(back);
    };
    rafRef.current = requestAnimationFrame(back);
  }, [paint]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 일부 브라우저 */ }
    begin();
  }
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (e.repeat) return;
    begin();
  }
  function onKeyUp(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " " || e.key === "Enter") cancel();
  }

  const left = daysLeft(coupon.expiresAt);

  if (status === "used") {
    return (
      <section className={styles.used}>
        <div className={styles.usedInner}>
          <p className={styles.usedTitle}>사용 완료</p>
          <LiveClock />
          <hr className={styles.usedRule} />
          <p className={styles.usedMenu}>{coupon.menuName}</p>
          <p className={styles.usedStore}>
            <span className={styles.usedNo} aria-hidden="true">{store.no}</span>
            {store.shortName}
          </p>
          <dl className={styles.usedRows}>
            <div><dt>사용 시각</dt><dd className="mono">{usedAt ? fmtDateTime(usedAt) : "방금"}</dd></div>
            <div><dt>쿠폰 코드</dt><dd className="mono">{coupon.code}</dd></div>
          </dl>
          <p className={styles.usedNote}>
            위 시계가 흐르고 있어야 방금 사용한 화면이에요. 캡처한 화면은 시각이 멈춰 있어 쓸 수 없어요. 직원이 확인했다면 닫아도 돼요.
          </p>
          <Link href="/wallet" className="btn btn-dark">쿠폰함으로</Link>
        </div>
      </section>
    );
  }

  const inactive = status === "expired" || status === "void";

  return (
    <article ref={ticketRef} className={`paper-shadow ${styles.ticket} ${torn ? styles.torn : ""} ${holding ? styles.holding : ""}`} data-status={status}>
      <header className={styles.band}>
        <span className={styles.bandNo} aria-hidden="true">{store.no}</span>
        <span className={styles.bandName}>{store.shortName}</span>
        <span className={styles.bandDrink}>{store.drink}</span>
        <span className={styles.bandKind}>{KIND_LABEL[coupon.kind]}</span>
      </header>

      <div className={styles.body}>
        <p className={styles.free}>무료 사이드</p>
        <h1 className={styles.menu}>{coupon.menuName}</h1>
        <dl className={styles.rows}>
          <div><dt>사용 매장</dt><dd>{store.name}</dd></div>
          {store.address && <div><dt>주소</dt><dd>{store.address}</dd></div>}
          <div>
            <dt>유효 기간</dt>
            <dd className="mono">
              {fmtDate(coupon.expiresAt)}까지
              {status === "active" && left <= 7 && <span className={styles.left}> · {Math.max(left, 0)}일 남음</span>}
            </dd>
          </div>
          <div><dt>발급</dt><dd className="mono">{fmtDate(coupon.issuedAt)}</dd></div>
          {coupon.note && coupon.kind !== "side" && <div><dt>메모</dt><dd>{coupon.note}</dd></div>}
        </dl>

        <div className={styles.codeBlock}>
          <p className={styles.codeLabel}>쿠폰 코드</p>
          <p className={`mono ${styles.code}`} aria-label={`쿠폰 코드 ${coupon.code.split("").join(" ")}`}>{coupon.code}</p>
          <p className={styles.codeHelp}>직원이 관리자 화면에서 코드로도 확인할 수 있어요.</p>
        </div>

        {inactive && (
          <div className={styles.inactive}>
            <Stamp text={status === "expired" ? "만료" : "취소"} color="#6b665e" size={104} />
            <p className={styles.inactiveText}>
              {status === "expired"
                ? `이 쿠폰은 ${fmtDate(coupon.expiresAt)}에 만료됐어요. 새 영수증으로 다시 받을 수 있어요.`
                : `매장에서 취소한 쿠폰이에요.${coupon.note ? ` (${coupon.note})` : ""} 궁금하면 직원에게 물어봐 주세요.`}
            </p>
            <Link href="/verify" className={`btn ${styles.inkOutline}`}>영수증 다시 올리기</Link>
          </div>
        )}
      </div>

      {!inactive && (
        <>
          <p className={styles.show}>직원에게 이 화면을 보여 주세요.</p>

          <div className={styles.perf} aria-hidden="true">
            <svg className={styles.tear} viewBox="0 0 400 20" preserveAspectRatio="none">
              <path
                ref={tearRef}
                pathLength={1}
                d="M0 10 L14 6 L26 13 L40 8 L52 14 L66 7 L80 12 L96 5 L110 13 L124 8 L138 14 L152 6 L166 12 L180 9 L194 14 L208 6 L222 12 L236 8 L250 13 L264 5 L278 12 L292 9 L306 14 L320 7 L334 12 L348 8 L362 13 L376 6 L390 12 L400 9"
              />
            </svg>
          </div>

          <div className={styles.stub}>
            <button
              type="button"
              className={styles.hold}
              onPointerDown={onPointerDown}
              onPointerUp={cancel}
              onPointerCancel={cancel}
              onLostPointerCapture={cancel}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              onContextMenu={(e) => e.preventDefault()}
              disabled={busy}
              aria-describedby="hold-help"
            >
              <span className={styles.holdFill} aria-hidden="true" />
              <span className={styles.holdLabel}>{busy ? "사용 처리 중" : holding ? "계속 누르고 있어요" : "길게 눌러 사용하기"}</span>
              <span className={`mono ${styles.holdSec}`} aria-hidden="true">{(HOLD_MS / 1000).toFixed(1)}초</span>
            </button>
            <p id="hold-help" className={styles.holdHelp}>
              직원 앞에서만 눌러 주세요. 누르는 동안 절취선이 찢어지고, 손을 떼면 취소돼요. 한 번 사용하면 되돌릴 수 없어요.
            </p>
            {error && <p className="error" role="alert">{error}</p>}
          </div>
        </>
      )}
    </article>
  );
}
