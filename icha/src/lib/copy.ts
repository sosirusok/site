/** 홈과 이용 안내가 같이 쓰는 문구 — 두 화면에서 같은 말을 다르게 쓰지 않기 위해 한 곳에 둔다. 정보 문구는 명사구·합니다체. */
import type { Rules } from "./config";

/** 포스터의 "영수증 릴레이" 순서 — 한 매장 이용 후 영수증 지참 → 50m 안 다른 매장 방문 → 메인안주 1개 주문 → 매장별 특별 혜택. 번호는 화면이 따로 붙인다 */
export const STEP_LINES = ["매장에서 계산 시 휴대폰 번호 말하기", "쿠폰함에서 쿠폰 확인", "50m 내 다른 매장에서 메인안주 1개 주문", "쿠폰 제시 후 매장별 특별 혜택 수령"] as const;

/**
 * 혜택 한 줄(고정형) "다른 매장 쿠폰 제시 시 {품목} 무료" — 품목은 DB 혜택 이름들("또는"으로 잇는다), 없으면 포스터의 혜택 이름.
 * 품목 이름 안의 띄어쓰기와 '무료' 앞은 NBSP: 줄이 바뀌어도 "무료" 한 낱말이나 "1반" 같은 조각만 다음 줄로 떨어지지 않고 "산토리 프리미엄 생맥주 무료" 가 한 덩어리로 내려간다(홈 정보 종이·매장 화면 혜택 종이).
 */
export function giftLine(names: string[], fallback: string): string {
  const nb = (s: string) => s.trim().replace(/ /g, "\u00a0");
  const what = (names.length ? names : [fallback]).map(nb).join(" 또는 ");
  return `다른 매장 쿠폰 제시 시 ${what}\u00a0무료`;
}

/** "1일 3장 · 유효기간 30일" */
export function ruleLine(rules: Rules): string {
  return [
    `1일 ${rules.dailyLimitPerMember}장`,
    `유효기간 ${rules.couponValidDays}일`,
  ].filter(Boolean).join(" · ");
}
