/** 홈과 이용 안내가 같이 쓰는 문구 — 두 화면에서 같은 말을 다르게 쓰지 않기 위해 한 곳에 둔다. */
import { formatWon, type Rules } from "./config";

/** 포스터의 "영수증 릴레이" 순서 — 한 매장 이용 후 영수증 지참 → 50m 안 다른 매장 방문 → 메인안주 1개 주문 → 매장별 특별 혜택 */
export const STEP_LINES = ["한 매장에서 계산하고 영수증을 찍어 올려요", "50m 안 다른 매장으로 가요", "메인안주 1개 주문하고 쿠폰을 보여 줘요", "그 매장의 특별 혜택을 받아요"] as const;

export function ruleLine(rules: Rules): string {
  return [
    rules.sameDayOnly ? "당일 영수증만" : `계산하고 ${rules.receiptValidHours}시간 안`,
    rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상` : null,
    `하루 ${rules.dailyLimitPerMember}장`,
    `쿠폰 ${rules.couponValidDays}일`,
  ].filter(Boolean).join(" · ");
}
