"use client";
import { useEffect, useRef } from "react";
import s from "./tt.module.css";

/**
 * 아래에서 올라오는 판 — 바깥을 누르거나 Esc·뒤로 가기(안드로이드 뒤로 단추)로 닫힌다. 열리면 첫 입력칸(없으면 판)에 초점.
 * 열 때 기록을 하나 쌓고, 단추로 닫히면 그 기록을 걷는다 — 뒤로 가기가 판만 닫고 페이지는 떠나지 않게.
 */
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>("input, textarea");
    (first ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const mark = useRef<string | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    if (!mark.current) {
      mark.current = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      window.history.pushState({ ttSheet: mark.current }, "");
    }
    const onPop = () => {
      if ((window.history.state as { ttSheet?: string } | null)?.ttSheet === mark.current) return;
      mark.current = null;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      mounted.current = false;
      window.removeEventListener("popstate", onPop);
      // 정말 닫혔을 때만 기록을 걷는다(개발 모드는 효과를 한 번 껐다 다시 켜 본다 — 그때는 그대로 둔다)
      window.setTimeout(() => {
        if (mounted.current || !mark.current) return;
        if ((window.history.state as { ttSheet?: string } | null)?.ttSheet === mark.current) window.history.back();
        mark.current = null;
      }, 0);
    };
  }, []);

  return (
    <div className={s.backdrop} onClick={onClose} role="presentation">
      <div ref={ref} className={s.sheet} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
