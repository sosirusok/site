"use client";
import { useEffect, useRef } from "react";
import s from "./tt.module.css";

/** 아래에서 올라오는 판 — 바깥을 누르거나 Esc 로 닫힌다. 열리면 첫 입력칸(없으면 판)에 초점 */
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>("input, textarea");
    (first ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className={s.backdrop} onClick={onClose} role="presentation">
      <div ref={ref} className={s.sheet} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
