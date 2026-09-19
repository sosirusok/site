"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import styles from "./PlaceSheet.module.css";

export type PlaceSheetStore = {
  id: string;
  shortName: string;
  name: string;
  drink: string;
  benefitLabel: string;
  course: { n: number; line: string };
  home: string;
  review: string;
  directions: string;
  booking: string;
};

/**
 * 예약 시트 — 하단 탭 "예약"에서 연다. body 에 포털되어 화면의 어떤 것보다 위.
 * 아래에서 올라오는 각진 패널(위 가장자리 형광 띠): 제목 한 줄, 매장마다 [속 빈 차수 숫자 · 상호 · 술] + [예약](네이버 예약), 맨 아래 [Close].
 */
export function PlaceSheet({ stores, open, onClose }: { stores: PlaceSheetStore[]; open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="place-sheet-title" onClick={(e) => e.stopPropagation()}>
        <span className={styles.grip} aria-hidden="true" />
        <div className={styles.head}>
          <span className={styles.headEn} aria-hidden="true">NAVER BOOKING</span>
          <h2 id="place-sheet-title" className={styles.headKo}>어느 집부터?</h2>
        </div>
        <ul className={styles.list}>
          {stores.map((s) => (
            <li key={s.id} className={styles.item} data-store={s.id}>
              <span className={styles.course} aria-hidden="true">{String(s.course.n).padStart(2, "0")}</span>
              <span className={styles.body}>
                <span className={styles.name}>{s.shortName}</span>
                <span className={`small muted ${styles.sub}`}>{s.drink} · 쿠폰 혜택 {s.benefitLabel}</span>
              </span>
              <Button href={s.booking} variant="naver" size="sm" srSuffix={` — ${s.course.n}차 ${s.shortName}`}>예약</Button>
            </li>
          ))}
        </ul>
        <Button variant="ghost" onClick={onClose} className={styles.close}>닫기</Button>
      </div>
    </div>,
    document.body,
  );
}
