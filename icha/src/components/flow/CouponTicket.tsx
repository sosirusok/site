"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { daysLeft, fmtDate, fmtDateTimeSec, fmtMD, fmtMDHM, fmtTime } from "./format";
import { DotLine } from "./kit";
import { Ticket } from "./Ticket";
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
  /** 품목 사진(있으면 쿠폰 카드 오른쪽에) */
  image?: { src: string; local: boolean } | null;
  /** 네이버 플레이스 — 사용 완료 뒤 리뷰 작성(플레이스 트래픽) */
  placeReview?: string | null;
  placeHome?: string | null;
  /** 네이버 예약 */
  placeBooking?: string | null;
};

/** 이 시간 안에 사용한 쿠폰은 '방금 사용' 화면(흐르는 시계)을 보여 준다 */
const FRESH_MS = 3 * 60 * 1000;

/** 화면 캡처 재사용을 막는 현재 시각 — 마운트 뒤에만 그린다(서버와 불일치 방지). */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`card ${styles.clock}`} role="timer" aria-live="off">
      <p className="small muted">현재 시각</p>
      <p className={`num ${styles.clockTime}`}>{now ? fmtTime(now) : "--:--:--"}</p>
      <p className="small muted">{now ? fmtDate(now) : ""}</p>
    </div>
  );
}

/** 계산할 때 받은 쿠폰은 꼬리표 없음, 매장이 따로 넣어 준 쿠폰만 */
function kindText(c: Pick<TicketCoupon, "kind">): string | null {
  return c.kind === "side" ? null : "매장 쿠폰";
}

/**
 * 쿠폰 한 장 — 쿠폰 카드(큰 것), 조건·유효기간·발급 시각, 안내 한 줄, 아래 고정 바의 [직원 앞에서 사용하기].
 * 사용 = 바의 버튼 → 확인 시트(취소/사용) → 사용 완료(초 단위 시계, 기록 표, [네이버 리뷰 남기기]).
 */
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
      const msg = (data && !data.ok && data.error) || (res.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : "사용 처리에 실패했습니다. 직원에게 쿠폰 코드를 보여 주세요.");
      setError(msg);
      if (/이미 사용/.test(msg)) setStatus("used");
      else if (/기간이 지난|기간 만료/.test(msg)) setStatus("expired");
      else if (/취소된/.test(msg)) setStatus("void");
    } catch {
      setError("네트워크 연결을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const left = daysLeft(coupon.expiresAt);
  const usedMs = usedAt ? Date.now() - new Date(usedAt).getTime() : Number.POSITIVE_INFINITY;
  const fresh = justUsed || usedMs < FRESH_MS;
  const ticketData = { storeId: store.id, storeName: store.shortName, menuName: coupon.menuName, code: coupon.code, expiresAt: coupon.expiresAt, image: store.image ?? null, kindLabel: kindText(coupon) };

  /* 사용한 쿠폰 */
  if (status === "used") {
    return (
      <article className={styles.root} data-status="used" aria-live="polite">
        <header className={styles.state}>
          <span className={`badge badge-naver badge-lg ${styles.stateBadge}`}>{fresh ? "사용 처리 완료" : "사용된 쿠폰"}</span>
          <h1 className="h1">{fresh ? "사용 처리되었습니다" : "이미 사용한 쿠폰입니다"}</h1>
        </header>
        <Ticket t={{ ...ticketData, meta: `${usedAt ? fmtMDHM(usedAt) : "방금"} 사용` }} size="lg" dim stamp="사용 완료" />
        {fresh && <LiveClock />}
        {fresh && <p className={`small muted ${styles.hint}`}>직원 확인용 화면입니다. 위 시계는 현재 시각으로 움직이며 캡처 화면에서는 멈춥니다.</p>}
        <dl className={`kv card card-pad ${styles.record}`}>
          <dt>사용 시각</dt><dd className="num">{usedAt ? fmtDateTimeSec(usedAt) : "방금"}</dd>
          <dt>매장</dt><dd>{store.shortName}</dd>
          <dt>품목</dt><dd>{coupon.menuName}</dd>
          <dt>코드</dt><dd className="mono">{coupon.code}</dd>
        </dl>
        <div className={styles.actions}>
          {store.placeReview && <Button href={store.placeReview} variant="naver" size="lg" block>네이버 리뷰 남기기</Button>}
          <Link href="/wallet" className="link">쿠폰함으로</Link>
        </div>
      </article>
    );
  }

  if (status === "expired" || status === "void") {
    const expired = status === "expired";
    return (
      <article className={styles.root} data-status={status}>
        <header className={styles.state}>
          <span className={`badge badge-lg ${styles.stateBadge}`}>{expired ? "기간 만료" : "취소됨"}</span>
          <h1 className="h1">{expired ? "기간이 지난 쿠폰입니다" : "취소된 쿠폰입니다"}</h1>
          <p className="lead">
            {expired
              ? `${fmtMD(coupon.expiresAt)}까지 사용 가능했던 쿠폰입니다. 다음 계산 시 휴대폰 번호를 말씀하시면 새 쿠폰이 발급됩니다.`
              : "매장에서 취소한 쿠폰입니다. 문의는 해당 매장으로 부탁드립니다."}
          </p>
        </header>
        <Ticket t={{ ...ticketData, meta: expired ? `${fmtMD(coupon.expiresAt)} 만료` : "매장에서 취소" }} size="lg" dim stamp={expired ? "기간 만료" : "취소"} />
        {error && <p className="error" role="alert">{error}</p>}
        <div className={styles.actions}>
          <Button href="/wallet" variant="primary" size="lg" block>쿠폰함 열기</Button>
        </div>
      </article>
    );
  }

  /* 쓸 수 있는 쿠폰 */
  return (
    <article className={styles.root} data-status="active">
      <header className={styles.state}>
        <span className="eyebrow">Coupon</span>
        <h1 className="h1">{store.shortName} 쿠폰</h1>
        <p className="lead">메인안주 1개 주문 시 직원에게 이 화면을 보여 주세요.</p>
      </header>
      <Ticket t={ticketData} size="lg" stamp={left <= 7 ? `${Math.max(left, 0)}일 남음` : null} />

      <dl className={`kv card card-pad ${styles.info}`}>
        <dt>유효기간</dt><dd className="num">{fmtMD(coupon.expiresAt)}까지{left <= 7 && <b className={styles.soon}> · {Math.max(left, 0)}일 남음</b>}</dd>
        <dt>조건</dt><dd>메인안주 1개 주문 시 · 테이블당 1회</dd>
        <dt>발급</dt><dd className="num">{fmtMDHM(coupon.issuedAt)}</dd>
        {coupon.note && coupon.kind !== "side" && <><dt>메모</dt><dd>{coupon.note}</dd></>}
      </dl>

      <ul className="notice" aria-label="안내">
        <li>직원 확인 후 아래 버튼을 눌러 주세요. 사용 처리 후에는 취소할 수 없습니다.</li>
        <li>쿠폰은 {store.shortName}에서만 쓸 수 있습니다. 다른 쿠폰·할인과 함께 쓸 수 없습니다.</li>
      </ul>
      {store.placeBooking && <Button href={store.placeBooking} variant="outline" block srSuffix={` — ${store.shortName}`}>{store.shortName} 네이버 예약</Button>}

      {/* 아래 고정 바(탭 위) — [직원 앞에서 사용하기] */}
      <div className="fixed-col sticky-bar">
        {error && <p className="error" role="alert">{error}</p>}
        <Button variant="primary" size="lg" block onClick={() => { setError(null); setConfirming(true); }}>직원 앞에서 사용하기</Button>
      </div>

      {confirming && (
        <div className={styles.overlay} onClick={() => !busy && setConfirming(false)}>
          <div className={`fixed-col ${styles.sheetCol}`}>
            <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={`${id}-confirm`} onClick={(e) => e.stopPropagation()}>
              <span className={styles.grip} aria-hidden="true" />
              <h2 id={`${id}-confirm`} className="h3">쿠폰을 사용하시겠습니까?</h2>
              <p className={styles.sheetSub}>{store.shortName} · {coupon.menuName} 무료</p>
              <p className="small muted">직원 확인 후 사용해 주세요. 사용 후에는 취소할 수 없습니다.</p>
              {error && <p className="error" role="alert">{error}</p>}
              <div className={`btn-row ${styles.sheetBtns}`}>
                <button ref={cancelRef} type="button" className="btn btn-soft btn-lg" onClick={() => setConfirming(false)} disabled={busy}>취소</button>
                <Button variant="primary" size="lg" onClick={redeem} disabled={busy} aria-busy={busy || undefined}>{busy ? "처리 중…" : "사용하기"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
