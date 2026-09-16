import { DEFAULT_RULES, type Rules } from "./config";
import { one, query } from "./db";

const KEY = "rules";

export async function getRules(): Promise<Rules> {
  const row = await one<{ value: Partial<Rules> }>(`select value from settings where key=$1`, [KEY]);
  const v = row?.value ?? {};
  const merged: Rules = { ...DEFAULT_RULES, ...v };
  if (!Array.isArray(merged.tiers) || merged.tiers.length === 0) merged.tiers = DEFAULT_RULES.tiers;
  merged.tiers = [...merged.tiers].sort((a, b) => a.minSpend - b.minSpend);
  return merged;
}

export async function saveRules(patch: Partial<Rules>): Promise<Rules> {
  const current = await getRules();
  const next: Rules = { ...current, ...patch };
  await query(
    `insert into settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value=excluded.value, updated_at=now()`,
    [KEY, JSON.stringify(next)],
  );
  return next;
}

/** 누적 금액으로 등급 키 계산 ('none' 또는 tiers.key) */
export function tierFor(totalSpend: number, rules: Rules): { key: string; name: string; next: { name: string; remaining: number } | null } {
  let current: { key: string; name: string } = { key: "none", name: "일반" };
  let next: { name: string; remaining: number } | null = null;
  for (const t of rules.tiers) {
    if (totalSpend >= t.minSpend) current = { key: t.key, name: t.name };
    else {
      next = { name: t.name, remaining: t.minSpend - totalSpend };
      break;
    }
  }
  return { ...current, next };
}
