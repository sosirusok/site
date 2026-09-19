"use client";
import { useEffect, useState } from "react";

/**
 * 헤더의 로그인 상태 — 손님 화면은 정적 HTML(ISR)이라 서버가 세션을 모른다. 마운트 뒤 /api/auth/me 에 묻고,
 * 답을 sessionStorage 에 기억해 두어(같은 탭) 다음 전체 이동에서는 묻는 동안에도 꼬리표가 깜빡이지 않게 한다.
 * 알기 전(첫 그리기)에는 늘 "로그인" 상태로 그린다 — 서버 HTML 과 같아야 하이드레이션이 어긋나지 않는다.
 */
const KEY = "icha.me";

type Cached = { phone: string | null };

export function readMemberCache(): Cached | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw == null) return null;
    const v = JSON.parse(raw) as { phone?: unknown };
    return { phone: typeof v?.phone === "string" ? v.phone : null };
  } catch {
    return null;
  }
}

/** 로그인(번호)·로그아웃(null) 직후 미리 적어 두면 다음 화면의 헤더가 바로 맞는 상태로 그려진다 */
export function writeMemberCache(phone: string | null): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ phone }));
  } catch {
    /* 사생활 보호 모드 등 — 그냥 매번 묻는다 */
  }
}

/** 내 번호(로그인) 또는 null(아직 모르거나 로그아웃) */
export function useMemberPhone(): string | null {
  const [phone, setPhone] = useState<string | null>(null);
  useEffect(() => {
    const cached = readMemberCache();
    if (cached) setPhone(cached.phone);
    const ac = new AbortController();
    fetch("/api/auth/me", { cache: "no-store", signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ phone?: unknown }>) : null))
      .then((j) => {
        if (ac.signal.aborted || !j) return;
        const p = typeof j.phone === "string" ? j.phone : null;
        writeMemberCache(p);
        setPhone(p);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);
  return phone;
}
