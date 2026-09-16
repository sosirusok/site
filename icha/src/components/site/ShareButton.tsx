"use client";
import { useState } from "react";

/** 친구에게 보내기 — 휴대폰이면 공유 시트(카카오톡 등), 아니면 링크 복사 */
export function ShareButton({ title, text, url, className = "btn btn-secondary btn-block", children = "친구에게 보내기" }: { title: string; text: string; url?: string; className?: string; children?: React.ReactNode }) {
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
  return (
    <button type="button" className={className} onClick={share} aria-live="polite">
      {done ?? children}
    </button>
  );
}
