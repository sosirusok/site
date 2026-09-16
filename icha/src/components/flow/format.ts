/**
 * 손님 화면용 날짜·시간 표기 (한국 시간 고정). 서버/클라이언트 어디서나 같은 결과가 나오도록 Intl 로만 계산한다.
 */
import { STORE_IDS } from "@/lib/config";

const TZ = "Asia/Seoul";

type Parts = { y: string; m: string; d: string; h: string; mi: string; s: string };

function parts(date: Date): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const out: Partial<Parts> = {};
  for (const p of f.formatToParts(date)) {
    if (p.type === "year") out.y = p.value;
    else if (p.type === "month") out.m = p.value;
    else if (p.type === "day") out.d = p.value;
    else if (p.type === "hour") out.h = p.value === "24" ? "00" : p.value;
    else if (p.type === "minute") out.mi = p.value;
    else if (p.type === "second") out.s = p.value;
  }
  return { y: out.y ?? "----", m: out.m ?? "--", d: out.d ?? "--", h: out.h ?? "--", mi: out.mi ?? "--", s: out.s ?? "--" };
}

export function toDate(v: string | number | Date | null | undefined): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 2026.09.15 21:34 */
export function fmtDateTime(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "-";
  const p = parts(d);
  return `${p.y}.${p.m}.${p.d} ${p.h}:${p.mi}`;
}

/** 2026.09.15 */
export function fmtDate(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "-";
  const p = parts(d);
  return `${p.y}.${p.m}.${p.d}`;
}

/** 09.15 21:34 */
export function fmtShort(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "-";
  const p = parts(d);
  return `${p.m}.${p.d} ${p.h}:${p.mi}`;
}

/** 2026.09.15 21:34:05 */
export function fmtDateTimeSec(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "-";
  const p = parts(d);
  return `${p.y}.${p.m}.${p.d} ${p.h}:${p.mi}:${p.s}`;
}

/** 21:34:05 */
export function fmtTime(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "--:--:--";
  const p = parts(d);
  return `${p.h}:${p.mi}:${p.s}`;
}

/** 만료까지 남은 일수(올림). 지났으면 0 이하 */
export function daysLeft(v: string | Date | null | undefined, now = new Date()): number {
  const d = toDate(v);
  if (!d) return 0;
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

/** 영수증 결제 일시 문자열(OCR 'YYYY-MM-DDTHH:MM:SS', 한국 시간)을 보기 좋게 */
export function fmtOcrPaidAt(s: string | null | undefined): string {
  if (!s) return "-";
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(s);
  if (!m) return s;
  return `${m[1]}.${m[2]}.${m[3]} ${m[4]}:${m[5]}`;
}

/** 승인번호 일부 가리기: 앞 4자리만 */
export function maskApproval(no: string | null | undefined): string {
  if (!no) return "-";
  const t = no.replace(/\s/g, "");
  if (t.length <= 4) return t;
  return `${t.slice(0, 4)}${"*".repeat(Math.min(6, t.length - 4))}`;
}

/** 같은 경로 안에서만 이동하도록 next 파라미터를 거른다 */
export function safeNext(v: string | string[] | undefined, fallback: string): string {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s || !s.startsWith("/") || s.startsWith("//") || s.includes("\\")) return fallback;
  return s;
}

/** 매장 번호 01/02/03 — 홈·푸터와 같은 순서(STORE_IDS) */
export function storeNo(id: string | null | undefined): string {
  const i = id ? (STORE_IDS as string[]).indexOf(id) : -1;
  return i < 0 ? "--" : String(i + 1).padStart(2, "0");
}

/** 받침에 따라 조사 선택: josa("도쿄스탠드", "과와") → "도쿄스탠드와" */
export function josa(word: string, type: "은는" | "이가" | "을를" | "과와"): string {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const has = isHangul ? (last - 0xac00) % 28 > 0 : /[0-9]$/.test(word) ? [0, 1, 3, 6, 7, 8].includes(Number(word.slice(-1))) : false;
  switch (type) {
    case "은는": return word + (has ? "은" : "는");
    case "이가": return word + (has ? "이" : "가");
    case "을를": return word + (has ? "을" : "를");
    case "과와": return word + (has ? "과" : "와");
  }
}

/** "A와 B" / "A, B와 C" 처럼 이름을 잇는다 */
export function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  const head = names.slice(0, -1);
  const tail = names[names.length - 1]!;
  return `${head.slice(0, -1).join(", ")}${head.length > 1 ? ", " : ""}${josa(head[head.length - 1]!, "과와")} ${tail}`;
}

/** 9월 16일 */
export function fmtMD(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "-";
  const p = parts(d);
  return `${Number(p.m)}월 ${Number(p.d)}일`;
}

/** 9월 16일 21:34 */
export function fmtMDHM(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "-";
  const p = parts(d);
  return `${Number(p.m)}월 ${Number(p.d)}일 ${p.h}:${p.mi}`;
}
