"use client";
import { useState } from "react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
  }
  return (
    <button type="button" className={className} onClick={logout} disabled={busy}>
      {busy ? "잠시만요" : "로그아웃"}
    </button>
  );
}
