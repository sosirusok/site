"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import ui from "@/app/admin/admin.module.css";

export function AdminLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id.trim(), password: pw }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "로그인하지 못했습니다. 잠시 후 다시 시도하세요.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("서버에 연결하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={ui.form}>
      <div className={ui.field}>
        <label className={ui.label} htmlFor="admin-id">
          아이디
        </label>
        <input id="admin-id" className={ui.input} value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus required />
      </div>
      <div className={ui.field}>
        <label className={ui.label} htmlFor="admin-pw">
          비밀번호
        </label>
        <input id="admin-pw" type="password" className={ui.input} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
      </div>
      {error ? (
        <p className={`${ui.notice} ${ui.noticeBad}`} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={`${ui.button} ${ui.buttonBlock}`} disabled={busy} style={{ minHeight: 46 }}>
        {busy ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
