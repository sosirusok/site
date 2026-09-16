/** 홈과 이용 안내가 같이 쓰는 문구 — 두 화면에서 같은 말을 다르게 쓰지 않기 위해 한 곳에 둔다. */
import { formatWon, type Rules } from "./config";

export const STEP_LINES = ["영수증을 찍어 올려요", "옆집 두 곳 중 한 곳을 골라요", "직원에게 보여 주고 받아요"] as const;

export function ruleLine(rules: Rules): string {
  return [
    `계산하고 ${rules.receiptValidHours}시간 안`,
    rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상` : null,
    `하루 ${rules.dailyLimitPerMember}장`,
    `쿠폰 ${rules.couponValidDays}일`,
  ].filter(Boolean).join(" · ");
}
