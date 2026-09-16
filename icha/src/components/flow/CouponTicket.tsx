"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { daysLeft, fmtDate, fmtDateTimeSec, fmtMD, fmtMDHM, fmtTime } from "./format";
import { StickerButton } from "./kit";
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
  /** 품목 사진(있으면 종이 쿠폰 반쪽에) */
  image?: { src: string; local: boolean } | null;
  /** 네이버 플레이스 — 사용 완료 뒤 리뷰 남기기(플레이스 트래픽) */
  placeReview?: string | null;
  placeHome?: string | null;
  /** 네이버 예약 */
  placeBooking?: string | null;
};

/** 이 시간 안에 사용한 쿠폰은 '방금 사용' 화면(흐르는 시계)을 보여 준다 */
const FRESH_MS = 3 * 60 * 1000;

/** 화면 캡처 재사용을 막는 현재 시각 — 마운트 뒤에만 그린다(서버와 불일치 방지). 종이 위 Do Hyeon 숫자. */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`paper paper-r ${styles.clock}`} role="timer" aria-live="off">
      <p className={`hand ${styles.clockCap}`}>지금 시각</p>
      <p className={`disp num ${styles.clockTime}`}>{now ? fmtTime(now) : "--:--:--"}</p>
      <p className={styles.clockDate}>{now ? fmtDate(now) : ""}</p>
    </div>
  );
}

/** 계산할 때 받은 쿠폰은 꼬리표 없음, 매장이 따로 넣어 준 쿠폰만 */
function kindText(c: Pick<TicketCoupon, "kind">): string | null {
  return c.kind === "side" ? null : "매장 쿠폰";
}

/**
 * 쿠폰 한 장 — 쿠폰(키트 파일에 따라 네온 티켓 또는 종이 쿠폰), 노란 사용하기 스티커, 초록 예약하기 하나.
 * 사용 = 직원 앞에서 버튼 → 크림 종이 확인 시트 → 사용 완료(초록 도장, 초 단위 시계, 기록 종이, 리뷰 스티커).
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
  const ticketData = { storeId: store.id, storeName: store.shortName, menuName: coupon.menuName, code: coupon.code, expiresAt: coupon.expiresAt, image: store.image ?? null, kindLabel: kindText(coupon) };

  /* 사용한 쿠폰 */
  if (status === "used") {
    return (
      <article className={styles.root} data-status="used" aria-live="polite">
        <div className={styles.state}>
          <h1 className={`plate plate-green ${styles.h1}`}>{fresh ? "잘 썼어요" : "이미 쓴 쿠폰"}</h1>
        </div>
        <div className={styles.ticketWrap}>
          <Ticket t={ticketData} size="lg" rotate={-1.5} dim />
          <span className={`stamp stamp-green ${styles.bigStamp}`}>사용 완료</span>
        </div>
        {fresh && <LiveClock />}
        {fresh && <p className={`hand hand-w ${styles.hint}`}>직원은 위 시계가 지금 시각과 같은지만 봐 주세요. 캡처한 화면은 시계가 멈춰 있어요.</p>}
        <div className="paper paper-l">
          <div className="row"><b>사용 시각</b><span className="val num">{usedAt ? fmtDateTimeSec(usedAt) : "방금"}</span></div>
          <div className="row"><b>매장</b><span className="val">{store.shortName}</span></div>
          <div className="row"><b>품목</b><span className="val">{coupon.menuName}</span></div>
          <div className="row"><b>코드</b><span className="val mono">{coupon.code}</span></div>
        </div>
        {/* 기록 종이 아래 — 노란 리뷰 스티커 하나, 쿠폰함은 작은 밑줄 글자 */}
        <div className={styles.actions}>
          {store.placeReview && <StickerButton kind="review" href={store.placeReview} block className={styles.stretch}>네이버 리뷰 남기기</StickerButton>}
          <Link href="/wallet" className="link link-w">쿠폰함으로</Link>
        </div>
      </article>
    );
  }

  if (status === "expired" || status === "void") {
    const expired = status === "expired";
    return (
      <article className={styles.root} data-status={status}>
        <div className={styles.state}>
          <h1 className={`plate plate-red ${styles.h1}`}>{expired ? "기간이 지났어요" : "취소된 쿠폰"}</h1>
          <p className={`hand hand-w ${styles.stateSub}`}>
            {expired
              ? `${fmtMD(coupon.expiresAt)}까지 쓸 수 있었어요. 다음에 계산할 때 번호를 말하면 다시 받아요.`
              : `매장에서 취소했어요.${coupon.note ? ` (${coupon.note})` : ""} 궁금한 점은 직원에게 물어봐 주세요.`}
          </p>
        </div>
        <div className={styles.ticketWrap}>
          <Ticket t={ticketData} size="lg" rotate={1} dim />
          <span className={`stamp ${styles.bigStamp}`}>{expired ? "기간 지남" : "취소됨"}</span>
        </div>
        {error && <p className={`error ${styles.err}`} role="alert">{error}</p>}
        <div className={styles.actions}>
          <StickerButton kind="wallet" href="/wallet" block className={styles.stretch}>쿠폰함으로</StickerButton>
        </div>
      </article>
    );
  }

  /* 쓸 수 있는 쿠폰 */
  return (
    <article className={styles.root} data-status="active">
      <Ticket t={ticketData} size="lg" rotate={-1.5} />

      <div className={styles.info}>
        <p className={`hand hand-w ${styles.how}`}>메인안주 1개 주문 시 · 직원에게 보여 주세요</p>
        <p className={`hand hand-w ${styles.when}`}>
          {fmtMD(coupon.expiresAt)}까지{left <= 7 && <span className={styles.soon}> · {Math.max(left, 0)}일 남음</span>} · {fmtMDHM(coupon.issuedAt)}에 받음
        </p>
        {coupon.note && coupon.kind !== "side" && <p className={`hand hand-w ${styles.when}`}>{coupon.note}</p>}
      </div>

      <div className={styles.use}>
        {error && <p className={`error ${styles.err}`} role="alert">{error}</p>}
        <StickerButton kind="use" block className={styles.stretch} onClick={() => { setError(null); setConfirming(true); }}>직원 앞에서 사용하기</StickerButton>
        <p className={`hand hand-w ${styles.useCap}`}>직원이 확인한 뒤에 눌러 주세요. 한 번 쓰면 되돌릴 수 없어요.</p>
        {store.placeBooking && (
          <StickerButton kind="book" href={store.placeBooking} small rotate={1}>{store.shortName} 예약하기</StickerButton>
        )}
      </div>

      {confirming && (
        <div className={styles.overlay} onClick={() => !busy && setConfirming(false)}>
          <div className={`fixed-col ${styles.sheetCol}`}>
            <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={`${id}-confirm`} onClick={(e) => e.stopPropagation()}>
              <p id={`${id}-confirm`} className={styles.sheetTitle}><span className="plate plate-red">지금 사용할까요?</span></p>
              <p className={`hand ${styles.sheetSub}`}>{store.shortName} · {coupon.menuName} 무료</p>
              <p className={styles.sheetCap}>직원이 보고 있을 때만 눌러 주세요. 되돌릴 수 없어요.</p>
              {error && <p className="error" role="alert">{error}</p>}
              <div className={styles.sheetBtns}>
                <button ref={cancelRef} type="button" className="btn btn-secondary btn-r" onClick={() => setConfirming(false)} disabled={busy}>취소</button>
                <StickerButton kind="use" onClick={redeem} disabled={busy}>{busy ? "잠시만요" : "사용하기"}</StickerButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
