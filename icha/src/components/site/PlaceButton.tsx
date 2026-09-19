"use client";
import { useState } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { PlaceSheet, type PlaceSheetStore } from "./PlaceSheet";

/** 누르면 예약 시트(매장 고르기)가 열리는 버튼 — 시트 안에서 가게마다 [예약하기] 하나 */
export function PlaceButton({ stores, className = "", variant = "naver", size = "md", block = false, children = "예약하기" }: { stores: PlaceSheetStore[]; className?: string; variant?: ButtonVariant; size?: ButtonSize; block?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} block={block} className={className} onClick={() => setOpen(true)} aria-label={undefined}>{children}</Button>
      <PlaceSheet stores={stores} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
