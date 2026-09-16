"use client";
import { useState } from "react";
import { Chevron } from "@/components/ui/Chevron";

type Props = {
  title: string;
  text: string;
  url?: string;
  className?: string;
  children?: React.ReactNode;
  /** "row" 면 목록 행 모양(왼쪽 글, 오른쪽 꺾쇠)으로 그린다 */
  variant?: "button" | "row";
};

/** 친구에게 보내기 — 휴대폰이면 공유 시트(카카오톡 등), 아니면 링크 복사 */
export function ShareButton({ title, text, url, className, children = "친구에게 보내기", variant = "button" }: Props) {
  const [done, setDone] = useState<string | null>(null);
  async function share() {
    const href = url ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      setDone("링크를 복사했어요");
      setTimeout(() => setDone(null), 1800);
    } catch {
      /* 사용자가 취소 */
    }
  }
  if (variant === "row") {
    return (
      <button type="button" className={className ?? "row"} onClick={share} aria-live="polite">
        <span className="body"><span className="title">{done ?? children}</span></span>
        <Chevron />
      </button>
    );
  }
  return (
    <button type="button" className={className ?? "btn btn-secondary btn-block"} onClick={share} aria-live="polite">
      {done ?? children}
    </button>
  );
}
