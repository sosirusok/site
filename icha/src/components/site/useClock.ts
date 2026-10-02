"use client";
import { useEffect, useState } from "react";

/**
 * 지금 시각 — 마운트 전에는 null(서버가 그린 값을 그대로 쓴다), 뒤로는 1분마다·화면으로 돌아올 때마다 새로.
 * 매장 화면은 정적 HTML(ISR)이라 한동안 아무도 안 들어오면 몇 시간 전의 "영업 전/영업 중"이 남아 있다 — 영업시간은 고정 값이라 브라우저에서 다시 계산한다.
 */
export function useClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const onShow = () => {
      if (!document.hidden) tick();
    };
    tick();
    const t = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, []);
  return now;
}
