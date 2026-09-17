/**
 * 포스터 키트 — 디자이너가 만든 이미지 61장(55장 + 추가 6장) + 먼저 받은 네온 티켓·아이콘. public/images/kit/<이름>.png|jpg
 * scripts/kit-manifest.mjs(npm run kit) 가 폴더를 훑어 kit-manifest.json 을 만들고, 여기서는 그 JSON 만 읽는다.
 * 파일이 있으면 화면이 그 그림을 쓰고, 없으면 지금의 포스터 조각·CSS 로 그린다 — 코드 수정 없이 파일만 넣으면 된다.
 */
import type { CSSProperties } from "react";
import manifest from "./kit-manifest.json";

export type KitEntry = { src: string; w: number; h: number };

const M: Record<string, KitEntry | undefined> = manifest;

/** 키트에 그 이름의 그림이 있으면 { src, w, h }, 없으면 null */
export function kitPiece(name: string): KitEntry | null {
  return M[name] ?? null;
}

export function hasKit(name: string): boolean {
  return Boolean(M[name]);
}

/** 키트 61장의 이름(파일 이름에서 확장자를 뺀 것) — 55장 + 추가 6장(label-photo·label-phone·label-place·btn-details·btn-morephoto·btn-moremenu) */
export const KIT_NAMES = [
  "bg-night", "bg-night-wide",
  "title", "head-banner", "footer-line",
  "plate-tokyo", "plate-joseon", "plate-wareureu",
  "benefit-tokyo", "benefit-joseon", "benefit-wareureu",
  "ribbon-event", "step-1", "step-2", "step-3", "step-4", "pill-condition",
  "label-benefit", "label-menu", "label-map", "label-review", "label-howto", "label-faq", "label-wallet", "label-guide",
  "label-photo", "label-phone", "label-place",
  "btn-book", "btn-wallet", "btn-use", "btn-pick", "btn-get", "btn-search", "btn-review", "btn-login", "btn-close", "btn-directions",
  "btn-details", "btn-morephoto", "btn-moremenu",
  "icon-home", "icon-wallet", "icon-place", "icon-info",
  "note-good", "note-again", "note-today", "note-phone", "arrow", "tape", "stamp-free", "stamp-used",
  "cut-beer", "cut-makgeolli", "cut-soju", "cut-yogurt",
  "ticket", "empty-wallet", "notfound", "share",
] as const;
export type KitName = (typeof KIT_NAMES)[number];

/** 먼저 받은 8장 가운데 55장 목록에 없는 이름 */
export const KIT_EXTRA_NAMES = ["ticket-tokyo", "ticket-joseon", "ticket-wareureu", "sign-wareureu", "icon"] as const;
export type KitExtraName = (typeof KIT_EXTRA_NAMES)[number];

/**
 * 그림에 적힌 글자 그대로의 alt(2026-09 도착본 기준으로 대조). 글자가 없는 그림은 짧은 설명, 순전히 장식이면 "" (aria-hidden 으로 감춘다).
 * 버튼(btn-*)의 접근성 이름 = 그림에 적힌 글자: StickerButton 이 이 값을 sr-only 로 읽히게 한다(호출 쪽은 "— 매장" 같은 꼬리만 덧붙인다).
 * 도착한 그림의 글자가 다르면 여기만 고친다.
 */
export const KIT_ALT: Record<KitName | KitExtraName, string> = {
  "bg-night": "",
  "bg-night-wide": "",
  title: "알콜부시기",
  "head-banner": "알콜부시기 — 소주·맥주·막걸리, 서면 3가게 콜라보, 50m 안에서 즐기는 1차·2차·3차",
  "footer-line": "GOOD DRINKS GOOD FOOD GOOD PEOPLE in SEOMYEON",
  "plate-tokyo": "1차 맥주로 시작! 도쿄스탠드 서면",
  "plate-joseon": "2차 막걸리로 이어서! 조선칼국수와 통막걸리 밀리오레점",
  "plate-wareureu": "3차 소주로 마무리! 와르르맨숀 서면",
  "benefit-tokyo": "도쿄스탠드 — 산토리 프리미엄 생맥주",
  "benefit-joseon": "조선칼국수와 통막걸리 — 2통1반",
  "benefit-wareureu": "와르르맨숀 — 요거트 아이스크림 or 소주",
  "ribbon-event": "영수증 릴레이 EVENT",
  "step-1": "1. 한 매장 이용 후 영수증 지참",
  "step-2": "2. 50m 안 다른 매장 방문",
  "step-3": "3. 메인안주 1개 주문 시",
  "step-4": "4. 각 매장별 특별 혜택!",
  "pill-condition": "당일 영수증 한정 / 테이블당 1회 / 메인안주 1개 주문 시",
  "label-benefit": "특별 혜택",
  "label-menu": "메뉴",
  "label-map": "오시는 길",
  "label-review": "리뷰",
  "label-howto": "이렇게 받아요",
  "label-faq": "자주 묻는 질문",
  "label-wallet": "쿠폰함",
  "label-guide": "이용 안내",
  "btn-book": "예약하기",
  "btn-wallet": "쿠폰함 열기",
  "btn-use": "직원 앞에서 사용하기",
  "btn-pick": "어디서 쓸지 고르기",
  "btn-get": "이 쿠폰 받기",
  "btn-search": "네이버에서 검색",
  "btn-review": "네이버 리뷰 남기기",
  "btn-login": "로그인",
  "btn-close": "닫기",
  "btn-directions": "길찾기",
  "label-photo": "사진",
  "label-phone": "번호로 시작",
  "label-place": "어디부터 갈까요?",
  "btn-details": "사진·메뉴 더 보기",
  "btn-morephoto": "사진 더 보기",
  "btn-moremenu": "메뉴 전체 보기",
  "icon-home": "홈",
  "icon-wallet": "쿠폰함",
  "icon-place": "플레이스",
  "icon-info": "안내",
  "note-good": "좋은 술, 좋은 음식, 좋은 사람.",
  "note-again": "먹고 마시고 또 가자!",
  "note-today": "오늘 서면에서 알콜부시기!",
  "note-phone": "계산할 때 휴대폰 번호를 말하면 쿠폰이 들어와요",
  arrow: "",
  tape: "",
  "stamp-free": "무료",
  "stamp-used": "사용 완료",
  "cut-beer": "생맥주 한 잔",
  "cut-makgeolli": "막걸리 주전자 두 개와 사발",
  "cut-soju": "소주 한 병",
  "cut-yogurt": "요거트 아이스크림",
  ticket: "쿠폰 티켓",
  "empty-wallet": "빈 봉투",
  notfound: "옆으로 쓰러진 소주잔",
  share: "서면의 밤 — 생맥주, 소주, 스테인리스 막걸리 사발",
  "ticket-tokyo": "도쿄스탠드 쿠폰 티켓",
  "ticket-joseon": "조선칼국수와 통막걸리 쿠폰 티켓",
  "ticket-wareureu": "와르르맨숀 쿠폰 티켓",
  "sign-wareureu": "",
  icon: "알콜부시기",
};

/** 이름으로 alt — 목록에 없는 이름은 "" */
export function kitAlt(name: string): string {
  return (KIT_ALT as Record<string, string | undefined>)[name] ?? "";
}

/**
 * (site) 레이아웃의 .app 에 얹는 CSS 변수 — 키트에 있는 것만 넣는다.
 *  --kit-bg / --kit-bg-wide : 바탕(bg-night, bg-night-wide). 없으면 globals.css 의 bokeh-soft.jpg
 *  --kit-tape               : 테이프(tape, opacity .85). 없으면 CSS 크림 띠
 *  --kit-arrow              : 순서 사이 화살표(arrow). 없으면 CSS 빨간 화살표
 */
export function kitCssVars(): CSSProperties | undefined {
  const v: Record<string, string> = {};
  const bg = kitPiece("bg-night");
  const wide = kitPiece("bg-night-wide");
  const tape = kitPiece("tape");
  const arrow = kitPiece("arrow");
  if (bg) v["--kit-bg"] = `url("${bg.src}")`;
  if (wide) v["--kit-bg-wide"] = `url("${wide.src}")`;
  if (tape) {
    v["--kit-tape"] = `url("${tape.src}")`;
    v["--kit-tape-fill"] = "transparent";
    v["--kit-tape-shadow"] = "none";
    v["--kit-tape-opacity"] = "0.85"; // tape.png 는 알파가 약해(≈247/255) 화면에서 살짝 비치게
  }
  if (arrow) v["--kit-arrow"] = `url("${arrow.src}")`;
  return Object.keys(v).length ? (v as CSSProperties) : undefined;
}
