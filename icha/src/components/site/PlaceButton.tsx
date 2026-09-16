"use client";
import { useState } from "react";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";

/** 어디서든 누르면 예약 시트가 열리는 버튼 — 시트 안에서 가게마다 초록 버튼 하나(예약하기) */
export function PlaceButton({ stores, className = "btn btn-naver btn-block", children = "예약하기" }: { stores: PlaceSheetStore[]; className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
