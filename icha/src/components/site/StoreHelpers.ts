/**
 * 손님 화면 전용 도우미 — 영업시간 해석(오늘/지금 → 상태 칩 문구), 사진 고르기, 조사.
 * lib/ 는 공용이라 손대지 않고, 화면에서만 쓰는 계산을 여기 모은다. 위치 문구는 lib/locations.ts 값만 쓴다.
 */
import type { Store, StoreImage } from "@/lib/stores";

/* ───────── 영업시간 ───────── */

const DAY_INDEX: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

export type HoursLine = {
  days: string;
  time: string;
  dayset: Set<number>;
  /** 분 단위 */
  open: number | null;
  close: number | null;
  /** 마감이 다음날인지 */
  overnight: boolean;
  lastOrder: string | null;
  openText: string;
  closeText: string;
};

function parseDays(s: string): Set<number> {
  const out = new Set<number>();
  if (/매일/.test(s)) return new Set([0, 1, 2, 3, 4, 5, 6]);
  for (const tok of s.split(/[·,]/).map((t) => t.trim()).filter(Boolean)) {
    const m = tok.match(/^([일월화수목금토])\s*[~–-]\s*([일월화수목금토])$/);
    if (m) {
      const a = DAY_INDEX[m[1]!] ?? 0;
      const b = DAY_INDEX[m[2]!] ?? 0;
      let d = a;
      for (let i = 0; i < 7; i++) {
        out.add(d);
        if (d === b) break;
        d = (d + 1) % 7;
      }
    } else {
      const d = DAY_INDEX[tok.charAt(0)];
      if (d != null) out.add(d);
    }
  }
  return out;
}

export function parseHours(store: Pick<Store, "hours">): HoursLine[] {
  return store.hours.map((h) => {
    const m = h.time.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(다음날\s*)?(\d{1,2}):(\d{2})/);
    const lo = h.time.match(/주문\s*마감\s*(\d{1,2}:\d{2})/);
    const open = m ? Number(m[1]) * 60 + Number(m[2]) : null;
    const close = m ? Number(m[4]) * 60 + Number(m[5]) : null;
    const overnight = Boolean(m?.[3]) || (open != null && close != null && close <= open);
    return {
      days: h.days,
      time: h.time,
      dayset: parseDays(h.days),
      open,
      close,
      overnight,
      lastOrder: lo?.[1] ?? null,
      openText: m ? `${m[1]!.padStart(2, "0")}:${m[2]}` : "",
      closeText: m ? `${m[4]!.padStart(2, "0")}:${m[5]}` : "",
    };
  });
}

/** 한국 시간 기준 현재 요일·분 */
export function kstNow(now = new Date()): { dow: number; minutes: number; date: Date } {
  const k = new Date(now.getTime() + 9 * 3600 * 1000);
  return { dow: k.getUTCDay(), minutes: k.getUTCHours() * 60 + k.getUTCMinutes(), date: k };
}

export type OpenStatus = {
  open: boolean;
  /** "영업 중 · 09:00까지" / "영업 전 · 15:00 오픈" / "영업 종료" / "휴무" */
  text: string;
  /** 오늘 적용되는 영업시간 ("15:00 – 다음날 09:00"). 휴무면 "휴무" */
  today: string;
  lastOrder: string | null;
};

export function openStatus(store: Pick<Store, "hours">, now = new Date()): OpenStatus {
  const lines = parseHours(store);
  const { dow, minutes } = kstNow(now);
  const todayLine = lines.find((l) => l.dayset.has(dow)) ?? null;
  const yLine = lines.find((l) => l.dayset.has((dow + 6) % 7)) ?? null;
  const todayText = todayLine ? `${todayLine.openText} – ${todayLine.overnight ? "다음날 " : ""}${todayLine.closeText}` : "휴무";

  // 어제 시작해 새벽까지 이어지는 영업
  if (yLine && yLine.overnight && yLine.close != null && minutes < yLine.close) {
    return { open: true, text: `영업 중 · ${yLine.closeText}까지`, today: todayText, lastOrder: yLine.lastOrder };
  }
  if (todayLine && todayLine.open != null && todayLine.close != null) {
    const within = todayLine.overnight ? minutes >= todayLine.open : minutes >= todayLine.open && minutes < todayLine.close;
    if (within) return { open: true, text: `영업 중 · ${todayLine.overnight ? "다음날 " : ""}${todayLine.closeText}까지`, today: todayText, lastOrder: todayLine.lastOrder };
    if (minutes < todayLine.open) return { open: false, text: `영업 전 · ${todayLine.openText} 오픈`, today: todayText, lastOrder: todayLine.lastOrder };
    return { open: false, text: "영업 종료", today: todayText, lastOrder: todayLine.lastOrder };
  }
  return { open: false, text: "휴무", today: todayText, lastOrder: null };
}

/** "15:00 – 다음날 09:00 · 주문 마감 08:00" 한 줄 */
export function todayHoursText(st: OpenStatus): string {
  return st.lastOrder ? `${st.today} · 주문 마감 ${st.lastOrder}` : st.today;
}

/** 상태 칩 문구(4종 고정): "영업 중" / "영업 전 · 15:00 오픈" / "영업 종료" / 휴무는 "" (화면이 "휴무"를 따로 쓴다) */
export function nowText(st: OpenStatus): string {
  if (st.open) return "영업 중";
  if (st.text.startsWith("영업 전")) return st.text;
  if (st.text === "휴무") return "";
  return "영업 종료";
}

/* ───────── 사진 ───────── */

export function heroImage(store: Pick<Store, "images">): StoreImage | null {
  return store.images.find((i) => i.kind === "hero") ?? store.images[0] ?? null;
}

export function firstOfKind(store: Pick<Store, "images">, kind: StoreImage["kind"], skip = 0): StoreImage | null {
  return store.images.filter((i) => i.kind === kind)[skip] ?? null;
}

/* ───────── 조사 ───────── */

/** 받침 유무에 따라 조사를 고른다. josa("와르르맨숀", "은는") → "와르르맨숀은", josa("도쿄스탠드", "이나") → "도쿄스탠드나" */
export function josa(word: string, type: "은는" | "이가" | "을를" | "과와" | "이나" | "으로"): string {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const code = isHangul ? (last - 0xac00) % 28 : /[0-9]$/.test(word) ? ([0, 1, 3, 6, 7, 8].includes(Number(word.slice(-1))) ? 1 : 0) : 0;
  const has = code > 0;
  switch (type) {
    case "은는": return word + (has ? "은" : "는");
    case "이가": return word + (has ? "이" : "가");
    case "을를": return word + (has ? "을" : "를");
    case "과와": return word + (has ? "과" : "와");
    case "이나": return word + (has ? "이나" : "나");
    case "으로": return word + (has && code !== 8 ? "으로" : "로");
  }
}

/** ["도쿄스탠드", "와르르맨숀"] → "도쿄스탠드나 와르르맨숀" */
export function joinOr(names: string[]): string {
  return names.map((n, i) => (i < names.length - 1 ? josa(n, "이나") : n)).join(" ");
}

/** 격자용 사진: 대표 사진을 빼고 외관 → 내부 → 음식·술 → 메뉴판 순으로 */
export function gridPhotos(store: Pick<Store, "images">, max = 12): StoreImage[] {
  const order: StoreImage["kind"][] = ["exterior", "interior", "food", "drink", "menu"];
  const rest = store.images.filter((i) => i.kind !== "hero");
  return order.flatMap((k) => rest.filter((i) => i.kind === k)).slice(0, max);
}

/** "2026-09-15" → "2026년 9월" */
export function asOfText(asOf: string): string {
  const m = asOf.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}년 ${Number(m[2])}월` : asOf;
}
