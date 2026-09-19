"use client";
import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * 매장 화면 아래 고정 바 — 위쪽 [네이버 예약] 줄(#hero-cta)이 화면에 보이는 동안에는 숨어 있다가,
 * 그 줄이 위로 지나가면 올라온다. 초록 예약 버튼이 한 화면에 둘 보이지 않게 하려는 것이다.
 *
 * 바는 항상 DOM 에 있고 보이기만 바뀐다 — 스크롤 도중에 붙었다 떨어졌다 하면 그 순간 화면이 밀린다.
 * IntersectionObserver 가 없는 브라우저와 자바스크립트가 아직 안 붙은 첫 그림에서는 그냥 보이는 상태로 둔다(있는 편이 낫다).
 */
export function StoreActionBar({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cta = document.getElementById("hero-cta");
    if (!cta || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShown(!(e?.isIntersecting ?? false)), { rootMargin: "-8px 0px 0px 0px" });
    io.observe(cta);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="fixed-col sticky-bar" data-shown={shown ? "1" : "0"} aria-hidden={shown ? undefined : true}>
      {children}
    </div>
  );
}
