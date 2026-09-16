/**
 * 관리자 화면 표시용 포맷 함수 — 시각은 모두 한국 시간(KST)으로 보여 준다.
 */
import { formatWon } from "@/lib/config";

const KST_MS = 9 * 3600 * 1000;
const p2 = (n: number) => String(n).padStart(2, "0");

function kst(d: Date) {
  const k = new Date(d.getTime() + KST_MS);
  return { y: k.getUTCFullYear(), mo: k.getUTCMonth() + 1, d: k.getUTCDate(), h: k.getUTCHours(), mi: k.getUTCMinutes(), s: k.getUTCSeconds() };
}

/** 2026-09-15 */
export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "-";
  const k = kst(d);
  return `${k.y}-${p2(k.mo)}-${p2(k.d)}`;
}
/** 2026-09-15 22:41 */
export function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return "-";
  const k = kst(d);
  return `${k.y}-${p2(k.mo)}-${p2(k.d)} ${p2(k.h)}:${p2(k.mi)}`;
}
/** 09-15 22:41 (같은 해면 연도 생략) */
export function fmtShort(d: Date | null | undefined, now = new Date()): string {
  if (!d) return "-";
  const k = kst(d);
  const n = kst(now);
  const ymd = k.y === n.y ? `${p2(k.mo)}-${p2(k.d)}` : `${k.y}-${p2(k.mo)}-${p2(k.d)}`;
  return `${ymd} ${p2(k.h)}:${p2(k.mi)}`;
}
/** 3분 전 / 2시간 전 / 어제 / 3일 전 */
export function fmtAgo(d: Date | null | undefined, now = new Date()): string {
  if (!d) return "-";
  const diff = Math.max(0, now.getTime() - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const dd = Math.floor(h / 24);
  if (dd === 1) return "어제";
  if (dd < 30) return `${dd}일 전`;
  return fmtDate(d);
}
/** datetime-local 입력값(KST) ↔ Date */
export function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const k = kst(d);
  return `${k.y}-${p2(k.mo)}-${p2(k.d)}T${p2(k.h)}:${p2(k.mi)}`;
}
export function fromLocalInput(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}+09:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const won = formatWon;

export const RECEIPT_STATUS: Record<string, { label: string; tone: "ok" | "warn" | "bad" | "muted" }> = {
  approved: { label: "승인", tone: "ok" },
  review: { label: "확인 대기", tone: "warn" },
  rejected: { label: "반려", tone: "bad" },
};
export const COUPON_STATUS: Record<string, { label: string; tone: "ok" | "warn" | "bad" | "muted" | "info" }> = {
  active: { label: "사용 가능", tone: "ok" },
  used: { label: "사용됨", tone: "info" },
  expired: { label: "만료", tone: "muted" },
  void: { label: "취소", tone: "bad" },
};
export const COUPON_KIND: Record<string, string> = {
  side: "영수증 증정",
  vip: "등급 혜택",
  manual: "수동 발급",
};
export const AUDIT_ACTION: Record<string, string> = {
  "admin.login": "관리자 로그인",
  "admin.logout": "관리자 로그아웃",
  "receipt.approve": "영수증 승인",
  "receipt.reject": "영수증 반려",
  "coupon.redeem": "쿠폰 사용 처리",
  "coupon.void": "쿠폰 취소",
  "coupon.issue_manual": "쿠폰 수동 발급",
  "member.memo": "회원 메모 수정",
  "menu.save": "메뉴 저장",
  "menu.delete": "메뉴 삭제",
  "menu.gift": "무료 증정 변경",
  "menu.active": "메뉴 노출 변경",
  "menu.sort": "메뉴 순서 변경",
  "menu.image": "메뉴 사진 변경",
  "settings.save": "운영 규칙 저장",
  "settings.recalc_tiers": "회원 등급 재계산",
  "staff.create": "직원 계정 생성",
  "staff.active": "직원 계정 활성/비활성",
  "staff.password": "직원 비밀번호 재설정",
};

/** 등급 키 → 이름 */
export function tierName(key: string, tiers: { key: string; name: string }[]): string {
  if (key === "none" || !key) return "일반";
  return tiers.find((t) => t.key === key)?.name ?? key;
}

export function pct(n: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

/** 받침 유무에 따른 조사. 마지막 글자가 한글이 아니면(영문·숫자) 받침 없는 것으로 본다. */
export function josa(word: string, type: "이나" | "과와" | "은는" | "이가" | "을를"): string {
  const last = word.charCodeAt(word.length - 1);
  const hangul = last >= 0xac00 && last <= 0xd7a3;
  const batchim = hangul ? (last - 0xac00) % 28 !== 0 : false;
  const map: Record<typeof type, [string, string]> = { 이나: ["이나", "나"], 과와: ["과", "와"], 은는: ["은", "는"], 이가: ["이", "가"], 을를: ["을", "를"] };
  return word + map[type][batchim ? 0 : 1];
}

/** "A나 B", "A와 B" 처럼 이름 목록을 조사로 잇는다 */
export function joinWithJosa(names: string[], type: "이나" | "과와"): string {
  return names.map((n, i) => (i < names.length - 1 ? josa(n, type) : n)).join(" ");
}
