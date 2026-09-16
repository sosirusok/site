"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { Fx } from "@/components/art/Fx";
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
};

const STAMP = { src: "/art/stamp-used.png", width: 279, height: 116 };
const FRAME = { src: "/art/confirm-frame.png", width: 640, height: 587 };
const USE_BTN = { src: "/art/btn-use-staff.png", width: 640, height: 125 };
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
    <p className={styles.clock} role="timer" aria-live="off">
      <span className={styles.clockLabel}>지금 시각</span>
      <span className={`mono ${styles.clockTime}`}>{now ? fmtTime(now) : "--:--:--"}</span>
      <span className={styles.clockDate}>{now ? fmtDate(now) : ""}</span>
    </p>
  );
}

function ticketName(c: Pick<TicketCoupon, "kind">, store: TicketStore): string {
  return c.kind === "vip" ? "vip-coupon" : `coupon-${store.id}`;
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

  // 확인 창이 열려 있으면 Esc 로 닫는다
  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setConfirming(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        return;
      }
      const msg = (data && !data.ok && data.error) || (res.status === 401 ? "로그인이 풀렸어요. 다시 로그인해 주세요." : "사용 처리가 안 됐어요. 직원에게 쿠폰 코드를 보여 주세요.");
      setError(msg);
      if (/이미 사용/.test(msg)) setStatus("used");
      else if (/기간이 지난/.test(msg)) setStatus("expired");
      else if (/취소된/.test(msg)) setStatus("void");
    } catch {
      setError("연결이 끊겨서 처리하지 못했어요. 통신 상태를 확인한 뒤 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const left = daysLeft(coupon.expiresAt);
  const usedMs = usedAt ? Date.now() - new Date(usedAt).getTime() : Number.POSITIVE_INFINITY;
  const fresh = justUsed || usedMs < FRESH_MS;
  const art = ticketName(coupon, store);

  /* 사용한 쿠폰: 티켓 위에 사용 완료 스탬프 */
  if (status === "used") {
    return (
      <article className={styles.root} data-status="used" aria-live="polite">
        <div className={styles.ticketArt}>
          <Art name={art} alt={`${store.shortName} ${coupon.menuName} 무료 쿠폰`} sizes="(min-width: 760px) 520px, 92vw" priority className={styles.ticketDim} />
          <Image src={STAMP.src} alt="사용 완료" width={STAMP.width} height={STAMP.height} sizes="(min-width: 760px) 220px, 40vw" className={styles.stamp} draggable={false} />
        </div>
        <div className={styles.doneHead}>
          <Fx seq="check" width={80} />
          <p className="h2">{fresh ? "잘 썼어요" : "이미 쓴 쿠폰이에요"}</p>
        </div>
        {fresh && <LiveClock />}
        <dl className={styles.rows}>
          <div><dt>사용 시각</dt><dd className="mono">{usedAt ? fmtDateTimeSec(usedAt) : "방금"}</dd></div>
          <div><dt>매장</dt><dd>{store.name}</dd></div>
          <div><dt>품목</dt><dd>{coupon.menuName}</dd></div>
          <div><dt>코드</dt><dd className={`mono ${styles.rowCode}`}>{coupon.code}</dd></div>
        </dl>
        {fresh && <p className={styles.doneNote}>직원분은 이 화면의 시각이 지금 시각과 같은지만 봐 주세요. 캡처한 화면은 시계가 멈춰 있어요.</p>}
        <Link href="/wallet" className="btn btn-outline">쿠폰함으로</Link>
      </article>
    );
  }

  if (status === "expired" || status === "void") {
    const expired = status === "expired";
    return (
      <article className={styles.root} data-status={status}>
        <div className={styles.ticketArt}>
          <Art name={art} alt={`${store.shortName} ${coupon.menuName} 무료 쿠폰`} sizes="(min-width: 760px) 520px, 92vw" priority className={styles.ticketDim} />
        </div>
        <div className={styles.stateRow}>
          <div className={styles.stateArt} aria-hidden="true">
            <Art name={expired ? "wallet-expired" : "status-used"} sizes="(min-width: 760px) 160px, 36vw" />
          </div>
          <div className={styles.stateText}>
            <p className="h2">{expired ? "기간이 지났어요" : "취소된 쿠폰이에요"}</p>
            <p>
              {expired
                ? `${fmtMD(coupon.expiresAt)}까지 쓸 수 있는 쿠폰이었어요. 새 영수증을 올리면 다시 받을 수 있어요.`
                : `매장에서 취소한 쿠폰이에요.${coupon.note ? ` (${coupon.note})` : ""} 궁금한 점은 매장 직원에게 물어봐 주세요.`}
            </p>
            <p className={`mono ${styles.stateCode}`}>{coupon.code}</p>
          </div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className={styles.actions}>
          {expired ? <ArtButton kind="start" href="/verify" width={340} /> : null}
          <Link href="/wallet" className="btn btn-outline">쿠폰함으로</Link>
        </div>
      </article>
    );
  }

  /* 쓸 수 있는 쿠폰 */
  return (
    <article className={styles.root} data-status="active">
      <div className={styles.ticketArt}>
        <Art name={art} alt={`${store.shortName} ${coupon.menuName} 무료 쿠폰`} sizes="(min-width: 760px) 520px, 92vw" priority />
      </div>

      <div className={styles.info}>
        <p className={styles.store}>{store.name}</p>
        <p className={styles.item}>
          <b>{coupon.menuName}</b> 무료{coupon.kind === "vip" ? " · VIP 쿠폰" : coupon.kind === "manual" ? " · 매장에서 드린 쿠폰" : ""}
        </p>
        <p className={`mono ${styles.code}`} aria-label={`쿠폰 코드 ${coupon.code.split("").join(" ")}`}>{coupon.code}</p>
        <p className={styles.codeHelp}>직원이 코드로도 확인할 수 있어요.</p>
        <p className={styles.exp}>
          <b>{fmtMD(coupon.expiresAt)}까지</b>{left <= 7 && ` · ${Math.max(left, 0)}일 남았어요`} · {fmtMDHM(coupon.issuedAt)}에 받음
        </p>
        {coupon.note && coupon.kind !== "side" && <p className={styles.note}>{coupon.note}</p>}
      </div>

      <div className={styles.use}>
        <p className={styles.show}>직원에게 이 화면을 보여 주세요.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="button" className={styles.useBtn} onClick={() => { setError(null); setConfirming(true); }} aria-label="직원 앞에서 사용하기">
          <Image src={USE_BTN.src} alt="" width={USE_BTN.width} height={USE_BTN.height} sizes="(min-width: 760px) 380px, 92vw" draggable={false} />
        </button>
        <p className={styles.useHelp}>직원이 확인한 뒤에 눌러 주세요. 한 번 쓰면 다시 쓸 수 없어요.</p>
      </div>

      {confirming && (
        <div className={styles.overlay} onClick={() => !busy && setConfirming(false)}>
          <div className={styles.confirm} role="dialog" aria-modal="true" aria-labelledby={`${id}-confirm`} onClick={(e) => e.stopPropagation()}>
            <Image src={FRAME.src} alt="" width={FRAME.width} height={FRAME.height} sizes="(min-width: 760px) 400px, 88vw" priority draggable={false} />
            <div className={styles.confirmBody}>
              <p className={styles.confirmStore}>{store.shortName}</p>
              <p id={`${id}-confirm`} className={styles.confirmTitle}>
                <b data-store={store.id}>{coupon.menuName}</b> 무료 쿠폰
              </p>
              <div className={styles.confirmArt} aria-hidden="true">
                <Art name={art} sizes="(min-width: 760px) 240px, 52vw" />
              </div>
              <p className={styles.confirmText}>직원이 확인했나요? 사용하기를 누르면 되돌릴 수 없어요.</p>
              {error && <p className="error" role="alert">{error}</p>}
            </div>
            {/* 그림 속 두 버튼 자리에 실제 버튼 */}
            <button ref={cancelRef} type="button" className={`${styles.hit} ${styles.hitCancel}`} onClick={() => setConfirming(false)} disabled={busy} aria-label="취소" />
            <button type="button" className={`${styles.hit} ${styles.hitUse}`} onClick={redeem} disabled={busy} aria-busy={busy} aria-label={busy ? "사용 처리 중" : "사용하기"}>
              {busy && <span className={styles.hitBusy}><Fx seq="spin" loop width={34} /></span>}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
