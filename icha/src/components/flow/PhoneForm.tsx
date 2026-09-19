"use client";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { writeMemberCache } from "@/components/site/useMember";
import { Button } from "@/components/ui/Button";
import { formatPhone, normalizePhone } from "@/lib/config";
import { safeNext } from "./format";
import styles from "./PhoneForm.module.css";

/** 입력 중인 숫자열을 자동 하이픈으로 보여 준다 (010-1234-5678) */
function pretty(digits: string): string {
  const d = digits.slice(0, 11);
  if (d.length === 10) return formatPhone(d);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/**
 * 휴대폰 번호 하나로 로그인하는 폼 — 계산 시 직원에게 말한 번호 그대로. 성공하면 next 로 전체 이동한다(상단 바까지 로그인 상태로).
 * next 를 안 주면 주소의 ?next= 를 보낼 때 읽는다(로그인 화면은 정적 HTML). 같은 사이트 안 경로만(safeNext).
 */
export function PhoneForm({ next, label = "로그인" }: { next?: string; label?: string }) {
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
      setError("휴대폰 번호를 정확히 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; member?: { phone?: string } } | null;
      if (!res.ok || !data?.ok) {
        setError(res.status === 429 ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." : data?.error ?? "로그인할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        setBusy(false);
        return;
      }
      writeMemberCache(data.member?.phone ?? phone); // 다음 화면의 헤더가 바로 내 번호로
      window.location.assign(next ?? safeNext(new URLSearchParams(window.location.search).get("next") ?? undefined, "/wallet"));
    } catch {
      setError("네트워크 연결을 확인해 주세요.");
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div>
        <label className="label" htmlFor={id}>휴대폰 번호</label>
        <input
          id={id}
          className={`input ${styles.phone}`}
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
        {error && <p id={`${id}-err`} className={`error ${styles.err}`} role="alert">{error}</p>}
      </div>
      <Button type="submit" variant="primary" size="lg" block disabled={busy} aria-busy={busy || undefined}>{busy ? "확인 중…" : label}</Button>
    </form>
  );
}
