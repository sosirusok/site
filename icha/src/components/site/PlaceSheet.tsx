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
 * 아래에서 올라오는 흰 패널(위 모서리 20px): 제목 한 줄, 매장마다 [차수 배지 · 상호 · 술] + [예약하기](네이버 예약), 맨 아래 [닫기].
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
          <h2 id="place-sheet-title" className="h3">예약할 매장을 선택하세요</h2>
          <p className="small muted">네이버 예약으로 이동합니다</p>
        </div>
        <ul className={styles.list}>
          {stores.map((s) => (
            <li key={s.id} className={styles.item} data-store={s.id}>
              <span className={`badge badge-store ${styles.course}`}>{s.course.n}차</span>
              <span className={styles.body}>
                <span className={styles.name}>{s.shortName}</span>
                <span className={`small muted ${styles.sub}`}>{s.drink} · 쿠폰 혜택 {s.benefitLabel}</span>
              </span>
              <Button href={s.booking} variant="naver" size="sm" srSuffix={` — ${s.shortName}`}>예약하기</Button>
            </li>
          ))}
        </ul>
        <Button variant="soft" block onClick={onClose}>닫기</Button>
      </div>
    </div>,
    document.body,
  );
}
