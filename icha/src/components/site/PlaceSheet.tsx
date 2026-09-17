"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StoreId } from "@/lib/config";
import { naverSearchUrl } from "@/lib/naver";
import { SectionLabel, StickerButton } from "./Kit";
import { Piece, plateOf } from "./Poster";
import styles from "./PlaceSheet.module.css";

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

export type PlaceSheetStore = { id: string; shortName: string; course: { n: number; line: string }; home: string; review: string; directions: string; booking: string };

/**
 * 예약 시트 — 하단 탭 "플레이스"와 예약 버튼에서 연다. body 에 포털되어 화면의 어떤 것보다 위(.app 은 isolation 이라 안의 z-index 가 못 넘어온다).
 * 아래에서 올라오는 크림색 종이 한 장: 제목은 키트 label-place("어디부터 갈까요?", 46px), 위 여백 18px 안쪽에 있어 잘리지 않고, 패널 안이 스크롤된다.
 * 매장마다 [간판 조각(≤200px, 조선칼국수는 112%)] [예약하기 초록 스티커 44px] [길찾기 꼬리표 40px] — 줄마다 정확히 이 셋(리뷰 링크는 매장 화면에 있다). 안내는 본문 글꼴 한 줄.
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
        <div className={styles.head}>
          <SectionLabel kind="place" color="red" as="h2" id="place-sheet-title" className={styles.title}>어디부터 갈까요?</SectionLabel>
          <p className={styles.sub}>네이버 예약으로 연결됩니다</p>
        </div>
        <ul className={styles.list}>
          {stores.map((s, i) => (
            <li key={s.id} className={styles.item} data-store={s.id}>
              <Piece name={plateOf(s.id as StoreId)} rotate={i % 2 === 0 ? -1.5 : 1.5} className={styles.plate} sizes="200px" />
              <span className="sr-only">{s.course.n}차 {s.shortName}</span>
              <div className={styles.side}>
                <StickerButton kind="book" size="sm" tilt={0} href={s.booking} suffix={` — ${s.shortName}`}>예약하기</StickerButton>
                <StickerButton kind="directions" tilt={0} secondary href={s.directions} suffix={` — ${s.shortName}`}>길찾기</StickerButton>
              </div>
            </li>
          ))}
        </ul>
        <div className={styles.foot}>
          <a className="link" href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer">네이버 검색 · {SEARCH_QUERY}</a>
          <StickerButton kind="close" tilt={0} secondary onClick={onClose}>닫기</StickerButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
