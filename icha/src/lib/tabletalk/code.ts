/**
 * 테이블 QR 주소와 영업일.
 *
 * QR 은 /t/{매장}-{번호}-{서명6자} 로 연다(예: /t/tokyo-7-k3p9xa). 서명은 SESSION_SECRET 으로 건 HMAC 의 앞 6자라
 * 한 테이블 QR 을 봤다고 다른 테이블 주소를 지어낼 수 없다. 인쇄한 QR 이 퍼졌으면 관리자에서 판(gen)을 올려 전부 새로 뽑는다.
 *
 * 사이트 [테이블톡] 탭(/talk)에서 번호를 골라 받는 주소는 따로 서명한다: /t/{매장}-{번호}-n{서명6자}.
 * 누구나 받을 수 있는 주소라 테이블에 앉았다는 증거가 못 된다 — 그래서 이 주소로는 열린 자리에 허락 없이 못 들어가고,
 * 사장님이 [QR 없이 번호로 들어오기]를 끄면 이 주소만 막힌다(인쇄한 QR 은 그대로).
 *
 * 영업일은 한국 시각 낮 12시에 바뀐다. 세 가게 중 가장 늦게 닫는 곳(조선칼국수, 금·토 오전 10시)과
 * 가장 일찍 여는 곳(오후 3시) 사이라 영업 중에 날이 바뀌지 않는다.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { secret } from "@/lib/auth/token";
import { STORE_IDS, type StoreId } from "@/lib/config";

/** 0·1 은 쓰고 i·l·o·u 는 뺀 32자 — 손으로 옮겨 적을 일이 생겨도 헷갈리지 않게 */
const ALPHA = "0123456789abcdefghjkmnpqrstvwxyz";
const SIG_LEN = 6;
export const MAX_TABLE = 99;

/** qr = 테이블에 붙인 QR · pick = 사이트에서 번호를 골라 받은 주소. 서명 영역이 달라 서로 바꿔 쓸 수 없다 */
export type CodeVia = "qr" | "pick";

function sign(store: StoreId, table: number, gen: number, via: CodeVia = "qr"): string {
  const mac = createHmac("sha256", Buffer.from(secret())).update(`${via === "qr" ? "tt" : "tt-pick"}|${store}|${table}|${gen}`).digest();
  let out = "";
  for (let i = 0; i < SIG_LEN; i++) out += ALPHA[mac[i]! & 31];
  return out;
}

/** 테이블에 붙이는 QR 의 주소 */
export function tableCode(store: StoreId, table: number, gen: number): string {
  return `${store}-${table}-${sign(store, table, gen)}`;
}

/** 사이트 [테이블톡] 탭에서 번호를 눌렀을 때의 주소 */
export function pickCode(store: StoreId, table: number, gen: number): string {
  return `${store}-${table}-n${sign(store, table, gen, "pick")}`;
}

/** via 가 없으면 테이블 QR 로 본다 */
export type TableRef = { store: StoreId; table: number; via?: CodeVia };

/** 서명까지 맞아야 통과. 판(gen)은 관리자 설정 값 */
export function parseTableCode(code: string, genOf: (store: StoreId) => number): TableRef | null {
  // QR 은 서명 6자, 번호로 받은 주소는 n + 6자 — 길이로 갈린다(6자 서명이 n 으로 시작해도 QR)
  const m = /^([a-z]+)-(\d{1,2})-(n?)([0-9a-z]{6})$/.exec(code.trim().toLowerCase());
  if (!m) return null;
  const store = m[1] as StoreId;
  if (!STORE_IDS.includes(store)) return null;
  const table = Number(m[2]);
  if (!Number.isInteger(table) || table < 1 || table > MAX_TABLE) return null;
  const via: CodeVia = m[3] ? "pick" : "qr";
  const want = Buffer.from(sign(store, table, genOf(store), via));
  const got = Buffer.from(m[4]!);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return { store, table, via };
}

/** 서명이 틀렸어도 주소 앞의 가게는 읽는다(안내 문구를 고를 때만 쓴다) */
export function storeOfCode(code: string): StoreId | null {
  const m = /^([a-z]+)-/.exec(code.trim().toLowerCase());
  return m && STORE_IDS.includes(m[1] as StoreId) ? (m[1] as StoreId) : null;
}

/** 영업일 'YYYY-MM-DD' — 한국 시각(UTC+9, 서머타임 없음)에서 12시간을 뺀 날짜 = UTC 에서 3시간을 뺀 날짜 */
export function serviceDay(now: Date): string {
  return new Date(now.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * 그 영업일이 끝나는 시각(다음 한국 낮 12시) — 쿠키 수명을 여기에 맞춘다.
 * now − 3h 가 day 안에 있으므로 now 는 [day 03:00Z, day+1 03:00Z) 안에 있고, 끝은 언제나 day+1 03:00Z 다.
 */
export function serviceDayEndsAt(now: Date): Date {
  return new Date(Date.parse(`${serviceDay(now)}T03:00:00.000Z`) + 86400 * 1000);
}
