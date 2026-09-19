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

/**
 * 이용 안내의 "알아 두실 점" — 관리자 설정(유효기간·1일 한도)을 그대로 읽어 적는다.
 * 문장을 화면에 직접 적어 두면 사장님이 설정을 바꿔도 안내가 옛 숫자로 남는다.
 */
export function noticeLines(rules: Rules): string[] {
  return [
    "쿠폰은 계산할 때 직원에게 휴대폰 번호를 말씀하시면 발급됩니다.",
    `쿠폰 1장당 사용 매장은 1곳이고, 발급 후 매장 변경은 되지 않습니다.`,
    `유효기간은 발급일로부터 ${rules.couponValidDays}일입니다.`,
    `한 번호로 하루 ${rules.dailyLimitPerMember}장까지 받으실 수 있습니다.`,
    "쿠폰을 쓰실 매장에서 메인안주 1개를 주문하셔야 혜택이 적용됩니다.",
    "테이블당 1회, 다른 할인·행사와 중복되지 않습니다.",
    "혜택 품목은 매장 사정에 따라 같은 값의 다른 품목으로 바뀔 수 있습니다.",
    "사용하실 때 직원에게 쿠폰 화면을 보여 주시면 됩니다.",
  ];
}
