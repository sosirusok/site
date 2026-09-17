"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { daysLeft, fmtDate, fmtDateTimeSec, fmtMD, fmtMDHM, fmtTime } from "./format";
import { DotLine, KitCut, StickerButton } from "./kit";
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
  /** 네이버 플레이스 — 사용 완료 뒤 리뷰 작성(플레이스 트래픽) */
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
      <p className={styles.clockCap}>현재 시각</p>
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
 * 쿠폰 한 장 — 키트 티켓 그림 위의 쿠폰(한 단 가득), 아래 고정 크림 바의 [직원 앞에서 사용하기](64px), 초록 예약하기(44px) 하나.
 * 정보 줄(조건·유효기간·안내)은 보케 위 어두운 띠에 본문 글꼴로 — 손글씨·해요체 없음.
 * 사용 = 바의 버튼 → 크림 종이 확인 시트(취소는 크림 CSS 버튼 — 키트에 없는 말) → 사용 완료(키트 도장 stamp-used 96px, 초 단위 시계, 기록 종이, [네이버 리뷰 남기기]).
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
        <div className={styles.state}>
          <h1 className={`plate plate-green ${styles.plateGreen} ${styles.h1}`}>{fresh ? "사용 처리 완료" : "사용된 쿠폰"}</h1>
        </div>
        <div className={styles.ticketWrap}>
          <Ticket t={ticketData} size="lg" rotate={-1.5} dim />
          <KitCut name="stamp-used" width={96} className={styles.usedStamp} fallback={<span className={`stamp stamp-green ${styles.bigStamp}`}>사용 완료</span>} />
        </div>
        {fresh && <LiveClock />}
        {fresh && <p className={`${styles.strip} ${styles.hint}`}>직원 확인용. 위 시계는 현재 시각으로 움직이며 캡처 화면에서는 멈춥니다.</p>}
        {/* 기록 — 검은 띠 위 Do Hyeon 네 줄(머리말은 노랑) */}
        <div className={`${styles.strip} ${styles.record}`}>
          <p><span className={styles.recKey}>사용 시각</span> <span className="num">{usedAt ? fmtDateTimeSec(usedAt) : "방금"}</span></p>
          <p><span className={styles.recKey}>매장</span> {store.shortName}</p>
          <p><span className={styles.recKey}>품목</span> {coupon.menuName}</p>
          <p><span className={styles.recKey}>코드</span> <span className="mono">{coupon.code}</span></p>
        </div>
        {/* 기록 종이 아래 — 노란 리뷰 스티커 하나, 쿠폰함은 작은 밑줄 글자 */}
        <div className={styles.actions}>
          {store.placeReview && <StickerButton kind="review" href={store.placeReview} block className={styles.stretch}>네이버 리뷰 남기기</StickerButton>}
          <Link href="/wallet" className={`link link-w ${styles.pill}`}>쿠폰함</Link>
        </div>
      </article>
    );
  }

  if (status === "expired" || status === "void") {
    const expired = status === "expired";
    return (
      <article className={styles.root} data-status={status}>
        <div className={styles.state}>
          <h1 className={`plate plate-red ${styles.h1}`}>{expired ? "기간 만료 쿠폰" : "취소된 쿠폰"}</h1>
          <p className={`${styles.strip} ${styles.stateSub}`}>
            {expired
              ? `${fmtMD(coupon.expiresAt)}까지 사용 가능했던 쿠폰입니다. 다음 계산 시 휴대폰 번호를 말씀하시면 새 쿠폰이 발급됩니다.`
              : "매장에서 취소한 쿠폰입니다. 문의는 해당 매장으로 부탁드립니다."}
          </p>
        </div>
        <div className={styles.ticketWrap}>
          <Ticket t={ticketData} size="lg" rotate={1} dim />
          <span className={`stamp ${styles.bigStamp}`}>{expired ? <>기간<br />만료</> : "취소됨"}</span>
        </div>
        {error && <p className={`error ${styles.err}`} role="alert">{error}</p>}
        <div className={styles.actions}>
          <StickerButton kind="wallet" href="/wallet" block className={styles.stretch}>쿠폰함 열기</StickerButton>
        </div>
      </article>
    );
  }

  /* 쓸 수 있는 쿠폰 */
  return (
    <article className={styles.root} data-status="active">
      <Ticket t={ticketData} size="lg" rotate={-1.5} />
      {store.placeBooking && (
        <div className={styles.bookRow}>
          <StickerButton kind="book" href={store.placeBooking} small rotate={1} suffix={` — ${store.shortName}`}>예약하기</StickerButton>
        </div>
      )}

      <div className={`${styles.strip} ${styles.info}`}>
        <p className={styles.how}>메인안주 1개 주문 시 · 직원에게 제시</p>
        <p className={styles.when}>
          <DotLine items={[`유효기간 ${fmtMD(coupon.expiresAt)}까지`, ...(left <= 7 ? [<span key="soon" className={styles.soon}>{Math.max(left, 0)}일 남음</span>] : []), `발급 ${fmtMDHM(coupon.issuedAt)}`]} />
        </p>
        {coupon.note && coupon.kind !== "side" && <p className={styles.when}>{coupon.note}</p>}
      </div>

      <div className={styles.use}>
        <p className={`${styles.strip} ${styles.useCap}`}>직원 확인 후 아래 버튼을 눌러 주세요. 사용 처리 후에는 취소할 수 없습니다.</p>
      </div>

      {/* 아래 고정 크림 바(탭 위) — 키트 [직원 앞에서 사용하기] 64px */}
      <div className="fixed-col sticky-bar">
        {error && <p className={`error ${styles.err}`} role="alert">{error}</p>}
        <StickerButton kind="use" block onClick={() => { setError(null); setConfirming(true); }}>직원 앞에서 사용하기</StickerButton>
      </div>

      {confirming && (
        <div className={styles.overlay} onClick={() => !busy && setConfirming(false)}>
          <div className={`fixed-col ${styles.sheetCol}`}>
            <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={`${id}-confirm`} onClick={(e) => e.stopPropagation()}>
              <p id={`${id}-confirm`} className={styles.sheetTitle}><span className="plate plate-red">쿠폰을 사용하시겠습니까?</span></p>
              <p className={styles.sheetSub}>{store.shortName} · {coupon.menuName} 무료</p>
              <p className={styles.sheetCap}>직원 확인 후 사용해 주세요. 사용 후에는 취소할 수 없습니다.</p>
              {error && <p className="error" role="alert">{error}</p>}
              <div className={styles.sheetBtns}>
                <button ref={cancelRef} type="button" className={`btn btn-secondary btn-sm btn-0 ${styles.cancel}`} onClick={() => setConfirming(false)} disabled={busy}>취소</button>
                <StickerButton kind="use" rotate={0} onClick={redeem} disabled={busy} srText={busy ? "처리 중" : undefined}>{busy ? "처리 중" : "직원 앞에서 사용하기"}</StickerButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
