"use client";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { formatPhone, normalizePhone } from "@/lib/config";
import styles from "./PhoneForm.module.css";

/** 입력 중인 숫자열을 자동 하이픈으로 보여 준다 (010-1234-5678) */
function pretty(digits: string): string {
  const d = digits.slice(0, 11);
  if (d.length === 10) return formatPhone(d);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export function PhoneForm({ next }: { next: string }) {
  const id = useId();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    setDigits(e.target.value.replace(/\D/g, "").slice(0, 11));
    if (error) setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const phone = normalizePhone(digits);
    if (!phone) {
      setError("010으로 시작하는 11자리 번호를 넣어 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(res.status === 429 ? "너무 자주 눌렀어요. 잠시 뒤에 다시 해 주세요." : data?.error ?? "지금은 들어갈 수 없어요. 잠시 뒤에 다시 해 주세요.");
        setBusy(false);
        return;
      }
      // 상단 바(서버 컴포넌트)까지 로그인 상태로 바뀌도록 전체 이동
      window.location.assign(next);
    } catch {
      setError("연결이 끊겼어요. 다시 눌러 주세요.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label" htmlFor={id}>휴대폰 번호</label>
        <input
          id={id}
          className="input mono"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={pretty(digits)}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          disabled={busy}
          autoFocus
        />
        {error && <p id={`${id}-err`} className="error" role="alert">{error}</p>}
      </div>
      <button type="submit" className="btn btn-block" disabled={busy || digits.length < 10}>
        {busy ? "잠시만요" : "시작하기"}
      </button>
    </form>
  );
}
