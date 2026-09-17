"use client";
import { useState } from "react";
import { StickerButton } from "./Kit";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";

/** 어디서든 누르면 예약 시트가 열리는 초록 스티커(키트 btn-book, 52px) — 시트 안에서 가게마다 초록 버튼 하나(예약하기) */
export function PlaceButton({ stores, className = "", tilt = -1 }: { stores: PlaceSheetStore[]; className?: string; tilt?: -1 | 0 | 1 }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StickerButton kind="book" tilt={tilt} className={className} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>예약하기</StickerButton>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
