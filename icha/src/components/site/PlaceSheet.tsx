"use client";
import { useEffect, useState } from "react";
import styles from "./PlaceSheet.module.css";

export type PlaceSheetStore = { id: string; shortName: string; course: { n: number; line: string }; home: string; review: string; directions: string; booking: string };

/**
 * 네이버 플레이스로 보내는 바닥 시트 — 하단 탭 "플레이스"와 고정 버튼에서 연다.
 * 세 매장 각각 [플레이스 열기] [리뷰 보기] [길찾기]. 링크는 새 창(네이버 앱이 있으면 앱으로).
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
  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={`${styles.sheet}`} role="dialog" aria-modal="true" aria-label="네이버 플레이스" onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} aria-hidden="true" />
        <p className={`h2-event ${styles.title}`}>네이버 플레이스</p>
        <p className="cap">가게 소개·메뉴·리뷰는 네이버에서 봐요. 저장해 두면 다음에 찾기 편해요.</p>
        <ul className={styles.list}>
          {stores.map((s) => (
            <li key={s.id} className={styles.item} data-store={s.id}>
              <div className={styles.head}>
                <span className="tag tag-store">{s.course.n}차</span>
                <span className={styles.name}>{s.shortName}</span>
                <span className="cap">{s.course.line}</span>
              </div>
              <div className={styles.btns}>
                <a className="btn btn-naver btn-sm" href={s.home} target="_blank" rel="noreferrer">플레이스 열기</a>
                <a className="btn btn-naver btn-sm" href={s.booking} target="_blank" rel="noreferrer">예약하기</a>
                <a className="btn btn-secondary btn-sm" href={s.review} target="_blank" rel="noreferrer">리뷰</a>
                <a className="btn btn-secondary btn-sm" href={s.directions} target="_blank" rel="noreferrer">길찾기</a>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className={`btn btn-secondary btn-block ${styles.close}`} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
