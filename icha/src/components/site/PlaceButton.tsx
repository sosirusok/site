"use client";
import { useState } from "react";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";

/** 어디서든 누르면 플레이스 시트가 열리는 버튼 */
export function PlaceButton({ stores, className = "btn btn-naver btn-block", children = "네이버 플레이스에서 보기" }: { stores: PlaceSheetStore[]; className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
