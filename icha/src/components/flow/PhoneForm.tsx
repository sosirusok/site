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
      setError("휴대폰 번호 형식이 올바르지 않습니다. 예: 010-1234-5678");
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
        setError(data?.error ?? (res.status === 429 ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주십시오." : "지금은 로그인할 수 없습니다. 잠시 후 다시 시도해 주십시오."));
        setBusy(false);
        return;
      }
      // 상단 메뉴(서버 컴포넌트)까지 로그인 상태로 바뀌도록 전체 이동
      window.location.assign(next);
    } catch {
      setError("연결이 끊겼습니다. 통신 상태를 확인한 뒤 다시 시도해 주십시오.");
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
          aria-describedby={`${id}-help`}
          aria-invalid={error ? true : undefined}
          disabled={busy}
        />
        <p id={`${id}-help`} className="help">쿠폰은 입력한 번호에 보관됩니다. 인증번호는 발송하지 않습니다.</p>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      <button type="submit" className="btn btn-red btn-lg btn-block" disabled={busy}>
        {busy ? "확인 중" : "시작하기"}
      </button>
    </form>
  );
}
