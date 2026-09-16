"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StoreId } from "@/lib/config";
import { naverSearchUrl } from "@/lib/naver";
import { Piece, plateOf } from "./Poster";
import styles from "./PlaceSheet.module.css";

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

export type PlaceSheetStore = { id: string; shortName: string; course: { n: number; line: string }; home: string; review: string; directions: string; booking: string };

/**
 * 예약 시트 — 하단 탭 "플레이스"와 예약 버튼에서 연다. 아래에서 올라오는 크림색 종이 한 장.
 * 가게마다 포스터 간판 조각 하나 + 초록 스티커 [예약하기] 하나. 리뷰·길찾기는 작은 글자.
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
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="예약하기" onClick={(e) => e.stopPropagation()}>
        <p className={styles.title}><span className="plate plate-red">어디부터 갈까요?</span></p>
        <p className={`hand ${styles.sub}`}>네이버 예약으로 이어져요. 자리 있는지 보고 가면 편해요.</p>
        <ul className={styles.list}>
          {stores.map((s, i) => (
            <li key={s.id} className={styles.item} data-store={s.id}>
              <Piece name={plateOf(s.id as StoreId)} rotate={i % 2 === 0 ? -2 : 2} className={styles.plate} sizes="200px" />
              <span className="sr-only">{s.course.n}차 {s.shortName}</span>
              <div className={styles.side}>
                <a className="btn btn-naver btn-sm" href={s.booking} target="_blank" rel="noreferrer">예약하기<span className="sr-only"> — {s.shortName}</span></a>
                <div className={styles.links}>
                  <a className="link" href={s.review} target="_blank" rel="noreferrer">리뷰</a>
                  <a className="link" href={s.directions} target="_blank" rel="noreferrer">길찾기</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className={styles.foot}>
          <a className="link" href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer">네이버에서 ‘{SEARCH_QUERY}’ 검색</a>
          <button type="button" className="btn btn-secondary btn-sm btn-r" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
