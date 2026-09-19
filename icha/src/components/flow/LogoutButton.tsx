"use client";
import { useState } from "react";
import { writeMemberCache } from "@/components/site/useMember";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      writeMemberCache(null); // 다음 화면의 헤더가 옛 번호 꼬리표를 잠깐 그리지 않게
      window.location.assign("/");
    }
  }
  return (
    <button type="button" className={className} onClick={logout} disabled={busy}>
      {busy ? "처리 중" : "로그아웃"}
    </button>
  );
}
