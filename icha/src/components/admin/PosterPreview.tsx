"use client";
import { useEffect, useRef, useState } from "react";
import s from "@/app/admin/(shell)/poster/poster.module.css";

const SHEET_W = 794; // 210mm @ 96dpi
const SHEET_H = 1123; // 297mm

/** 화면에서는 A4 시트를 컨테이너 너비에 맞춰 축소해 보여 준다. 인쇄 시 CSS 가 배율을 되돌린다. */
export function PosterPreview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / SHEET_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={s.previewOuter} style={{ height: Math.round(SHEET_H * scale) }}>
      <div className={s.previewInner} style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/** 인쇄 버튼. 배포 주소가 아니면(QR 이 로컬을 가리키면) 한 번 더 묻는다. */
export function PrintButton({ className, warn }: { className?: string; warn?: string | null }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (warn && !window.confirm(warn)) return;
        window.print();
      }}
    >
      인쇄
    </button>
  );
}
