"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StoreSign } from "@/components/site/StoreSign";
import type { StoreId } from "@/lib/config";
import { naverSearchUrl } from "@/lib/naver";
import styles from "./PlaceSheet.module.css";

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

export type PlaceSheetStore = { id: string; shortName: string; course: { n: number; line: string }; home: string; review: string; directions: string; booking: string };

/**
 * 예약 시트 — 하단 탭 "플레이스"와 고정 버튼에서 연다.
 * 가게마다 초록 버튼은 [예약하기] 하나뿐이고, 길찾기는 그 아래 작은 글자 링크다. 링크는 새 창(네이버 앱이 있으면 앱으로).
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
  // 고정 버튼(.sticky-cta)이나 하단 탭 안에서 열려도 시트가 그 위에 오도록 body 로 뺀다
  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="예약하기" onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} aria-hidden="true" />
        <p className={`tube ${styles.title}`}>어디부터 갈까요</p>
        <p className={styles.sub}>네이버 예약으로 이어져요. 자리 있는지 보고 가면 편해요.</p>
        <ul className={styles.list}>
          {stores.map((s) => (
            <li key={s.id} className={styles.item} data-store={s.id}>
              <div className={styles.head}>
                <span className={styles.n} aria-hidden="true">{s.course.n}차</span>
                <StoreSign id={s.id as StoreId} className={styles.sign} sizes="190px" />
                <span className="sr-only">{s.shortName}</span>
                <span className={styles.line}>{s.course.line}</span>
              </div>
              <a className="btn btn-naver btn-block btn-sm" href={s.booking} target="_blank" rel="noreferrer">예약하기<span className="sr-only"> — {s.shortName}</span></a>
              <div className={styles.links}>
                <a href={s.review} target="_blank" rel="noreferrer">리뷰</a>
                <a href={s.directions} target="_blank" rel="noreferrer">길찾기</a>
              </div>
            </li>
          ))}
        </ul>
        <a className={styles.search} href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer">네이버에서 ‘알콜부시기’ 검색</a>
        <button type="button" className={`btn btn-secondary btn-block ${styles.close}`} onClick={onClose}>닫기</button>
      </div>
    </div>,
    document.body,
  );
}
