/**
 * 테이블톡 매장별 설정 — 켜기/끄기, 테이블 수(번호판 칸 수), QR 없이 번호로 들어오기, QR 판(gen).
 * settings 테이블의 'tabletalk' 한 줄에 둔다. 손님 화면은 몇 초마다 묻기 때문에 30초 동안은 기억해 둔 값을 쓴다.
 */
import { STORE_IDS, type StoreId } from "@/lib/config";
import { one, query } from "@/lib/db";
import { MAX_TABLE } from "./code";

export type TTStoreSettings = {
  on: boolean;
  /** 번호판에 보일 테이블 수(1번부터). QR 은 이 수만큼 인쇄된다 */
  tables: number;
  /** 사이트 [테이블톡] 탭에서 테이블 번호를 골라 들어오기. 끄면 테이블에 붙은 QR 로만 들어온다 */
  pick: boolean;
  /** QR 판 번호 — 올리면 전에 인쇄한 QR 이 모두 무효가 된다 */
  gen: number;
};
export type TTSettings = Record<StoreId, TTStoreSettings>;

const KEY = "tabletalk";
export const DEFAULT_TABLES = 28;
const DEFAULT: TTStoreSettings = { on: true, tables: DEFAULT_TABLES, pick: true, gen: 1 };
const TTL_MS = 30_000;

let cache: { at: number; value: TTSettings } | null = null;

function normalize(raw: unknown): TTSettings {
  const v = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<StoreId, Partial<TTStoreSettings>>>;
  const out = {} as TTSettings;
  for (const id of STORE_IDS) {
    const s = v[id] ?? {};
    const tables = Number(s.tables);
    const gen = Number(s.gen);
    out[id] = {
      on: typeof s.on === "boolean" ? s.on : DEFAULT.on,
      tables: Number.isInteger(tables) && tables >= 1 && tables <= MAX_TABLE ? tables : DEFAULT.tables,
      pick: typeof s.pick === "boolean" ? s.pick : DEFAULT.pick,
      gen: Number.isInteger(gen) && gen >= 1 ? gen : DEFAULT.gen,
    };
  }
  return out;
}

export async function getTTSettings(fresh = false): Promise<TTSettings> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const row = await one<{ value: unknown }>(`select value from settings where key=$1`, [KEY]);
  const value = normalize(row?.value);
  cache = { at: Date.now(), value };
  return value;
}

export async function saveTTStore(store: StoreId, patch: Partial<TTStoreSettings>): Promise<TTSettings> {
  const current = await getTTSettings(true);
  const next = normalize({ ...current, [store]: { ...current[store], ...patch } });
  await query(
    `insert into settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value=excluded.value, updated_at=now()`,
    [KEY, JSON.stringify(next)],
  );
  cache = { at: Date.now(), value: next };
  return next;
}
