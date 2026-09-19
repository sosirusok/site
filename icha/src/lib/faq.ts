import type { Rules } from "./config";

export type Faq = { id: string; q: string; a: string };

/**
 * 자주 묻는 질문 — 이용 안내 화면에서만 쓴다.
 * "어떻게 받나요 / 어떻게 쓰나요 / 얼마나 가까운가요"는 같은 화면의 4단계와 홈 지도가 이미 답한다.
 * 그래서 4단계로 답이 안 되는 것만 남긴다. 규칙을 한 화면에서 세 번 말하면 그건 분량 채우기다.
 */
export function faqItems(rules: Rules): Faq[] {
  const days = rules.couponValidDays;
  const limit = rules.dailyLimitPerMember;
  return [
    { id: "when", q: "유효기간과 발급 한도는?", a: `발급일부터 ${days}일 동안 쓸 수 있습니다. 휴대폰 번호 1개당 하루 ${limit}장까지 발급됩니다.` },
    { id: "book", q: "예약은 어떻게 하나요?", a: "각 매장의 예약하기 버튼을 누르면 네이버 예약으로 연결됩니다. 매장에 직접 전화하셔도 됩니다." },
    { id: "phone", q: "휴대폰 번호는 어디에 쓰이나요?", a: "쿠폰 발급과 확인에만 사용합니다. 광고 문자나 전화는 발송하지 않습니다." },
    { id: "main", q: "메인안주는 무엇을 말하나요?", a: "각 매장 메뉴판의 안주 1개입니다. 해당 메뉴는 매장에서 확인해 주세요." },
  ];
}
