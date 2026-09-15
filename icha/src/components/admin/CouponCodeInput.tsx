"use client";
import { useState } from "react";
import s from "@/app/admin/(shell)/coupons/coupons.module.css";

/** 6자리 코드 입력 — 대문자·숫자만 남기고 자동 대문자. GET 폼이라 서버에서 조회한다. */
export function CouponCodeInput({ initial = "" }: { initial?: string }) {
  const [v, setV] = useState(initial.toUpperCase());
  return (
    <input
      name="code"
      className={s.codeInput}
      value={v}
      onChange={(e) => setV(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
      placeholder="ABC123"
      inputMode="text"
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      maxLength={6}
      aria-label="쿠폰 코드 6자리"
      autoFocus={!initial}
    />
  );
}
