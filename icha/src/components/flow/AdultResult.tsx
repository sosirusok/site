"use client";
import { useEffect, useState } from "react";
import styles from "./AdultResult.module.css";

/** 결과를 이 시간이 지나면 더 안 믿는다 — 지난 화면을 캡처해 두고 다시 보여 주는 걸 막는다 */
const FRESH_SECONDS = 180;

function ago(seconds: number): string {
  if (seconds < 60) return `${seconds}초 전 확인`;
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초 전 확인`;
}

function clock(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${h < 12 ? "오전" : "오후"} ${String(h % 12 || 12).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

/**
 * 직원이 보는 판 — 결과 한 글자.
 * verifiedAt 이 있으면(손님 폰으로 본인확인한 결과) 방금 확인한 것이라는 증거로 초가 살아 움직이고, 3분 지나면 더 안 믿는다.
 * 없으면(직원이 검증앱에서 본 출생연도를 친 경우) detail 에 그 연도를 다시 보여 줘 오타를 잡게 한다.
 */
export function AdultResult({ adult, verifiedAt, detail, onAgain }: { adult: boolean; verifiedAt?: string; detail?: string; onAgain: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!verifiedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [verifiedAt]);
  const seconds = verifiedAt ? Math.max(0, Math.floor((now - new Date(verifiedAt).getTime()) / 1000)) : 0;
  const stale = verifiedAt ? seconds > FRESH_SECONDS : false;

  if (stale) {
    return (
      <div className={styles.wrap} data-tone="stale">
        <p className={styles.big}>다시</p>
        <p className={styles.sub}>확인한 지 {Math.floor(seconds / 60)}분이 지났습니다</p>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onAgain}>다시 확인</button>
      </div>
    );
  }

  return (
    <div className={styles.wrap} data-tone={adult ? "ok" : "no"} role="status">
      <p className={styles.big}>{adult ? "성인" : "미성년"}</p>
      {detail && <p className={styles.sub}>{detail}</p>}
      {verifiedAt && (
        <>
          <p className={styles.sub}>{clock(verifiedAt)}</p>
          <p className={styles.live}>{ago(seconds)}</p>
        </>
      )}
      <button type="button" className="btn btn-outline btn-block" onClick={onAgain}>다음 손님</button>
    </div>
  );
}
