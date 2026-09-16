/** 홈과 이용 안내가 같이 쓰는 문구 — 두 화면에서 같은 말을 다르게 쓰지 않기 위해 한 곳에 둔다. 정보 문구는 명사구·합니다체. */
import type { Rules } from "./config";

/** 포스터의 "영수증 릴레이" 순서 — 한 매장 이용 후 영수증 지참 → 50m 안 다른 매장 방문 → 메인안주 1개 주문 → 매장별 특별 혜택. 번호는 화면이 따로 붙인다 */
export const STEP_LINES = ["매장에서 계산 시 휴대폰 번호 말하기", "쿠폰함에서 쿠폰 확인", "50m 내 다른 매장에서 메인안주 1개 주문", "쿠폰 제시 후 매장별 특별 혜택 수령"] as const;

/** "1일 3장 · 유효기간 30일" */
export function ruleLine(rules: Rules): string {
  return [
    `1일 ${rules.dailyLimitPerMember}장`,
    `유효기간 ${rules.couponValidDays}일`,
  ].filter(Boolean).join(" · ");
}
