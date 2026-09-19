/** 홈과 이용 안내가 같이 쓰는 문구 — 두 화면에서 같은 말을 다르게 쓰지 않기 위해 한 곳에 둔다. 정보 문구는 명사구·합니다체. */
import type { Rules } from "./config";

/** 포스터의 "영수증 릴레이" 순서 — 한 매장 이용 후 영수증 지참 → 50m 안 다른 매장 방문 → 메인안주 1개 주문 → 매장별 특별 혜택. 번호는 화면이 따로 붙인다 */
export const STEP_LINES = ["계산할 때 휴대폰 번호 말하기", "쿠폰함 열어 보기", "50m 안 다른 집에서 메인안주 1개 주문", "쿠폰 보여 주면 혜택이 나옵니다"] as const;

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

/**
 * 이벤트 기간 한 줄. 사장님이 관리자 화면에 날짜를 넣기 전에는 날짜를 지어내지 않는다 —
 * 시작·종료가 다 비면 "상시 운영 · 종료일은 매장 공지", 시작만 있으면 "10월 1일 시작 · 종료일은 매장 공지".
 */
export function eventPeriodLine(rules: Rules): string {
  const md = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    return m ? `${Number(m[2])}월 ${Number(m[3])}일` : "";
  };
  const a = md(rules.eventStart ?? "");
  const b = md(rules.eventEnd ?? "");
  if (a && b) return `${a} ~ ${b}`;
  if (a) return `${a} 시작 · 종료일은 매장 공지`;
  if (b) return `${b}까지`;
  return "상시 운영 · 종료일은 매장 공지";
}

