import type { StoreId } from "@/lib/config";

/**
 * 매장 화면 맨 위 사진(store.images 의 hero)을 어디에 맞춰 자를지 — 가게 간판은 절대 자르지 않는다.
 * 도쿄스탠드 hero.jpg(1600x1200)·조선칼국수 hero.jpg(900x676)는 간판이 맨 위 줄(위 3~17% / 6~22%)에 있어 50% 0%: 위를 그대로 두고 아래 보도·의자만 잘린다(68vw 상자, 4:3 사진은 아래 9% 만 잘린다).
 * 와르르맨숀은 exterior-sign-night(800x1067, 밤의 2F 초록 간판 라이트박스)가 hero — 50% 50% 이면 램프·2F 줄·큰 글자·WA-R-R MANSION 줄이 다 들어온다.
 */
export const HERO_POS: Record<StoreId, string> = {
  tokyo: "50% 0%",
  joseon: "50% 0%",
  wareureu: "50% 50%",
};

/**
 * 폴라로이드 한 장 — 사진, 4:3 창을 어디에 맞출지(pos), 흰 테두리 아래 캡션 한 줄(cap).
 * 캡션은 명사구 하나: 메뉴는 stores.ts 의 이름·가격 그대로("조선 김치전 · 12,000원"), 장소는 짧게("매장 입구", "1층 홀"). 문장·농담 없음.
 * pos 는 실제 파일의 4:3 창을 하나씩 잘라 보고 정한 값(2026-09 사진 검수) — 바꾸면 위 방해물(소주병·전화기·가스통)이 다시 들어온다.
 */
export type FanPhoto = { src: string; cap: string; pos?: string };

/**
 * 매장 화면 맨 위 한 장 — 그 가게의 실제 밤 간판 사진. 포스터에 그려진 세 간판과 같은 간판이고,
 * 아래 갤러리 첫 장(대표 안주)과 겹치지 않는다. pos 는 간판 글자가 잘리지 않는 자리로 하나씩 잘라 보고 정했다(2026-09).
 */
export const HERO_PHOTO: Record<StoreId, FanPhoto> = {
  tokyo: { src: "/images/stores/tokyo/exterior-light-sign.jpg", cap: "도쿄스탠드 서면점 입간판", pos: "50% 42%" },
  joseon: { src: "/images/stores/joseon/exterior-sign-night.jpg", cap: "조선칼국수와통막걸리 밤 간판", pos: "50% 45%" },
  wareureu: { src: "/images/stores/wareureu/exterior-sign-night.jpg", cap: "와르르맨숀 2층 간판", pos: "50% 45%" },
};


/** 홈에서 매장마다 붙이는 폴라로이드 세 장 — [0] 안주(큰 카드, 왼쪽), [1] 술 또는 둘째 안주(큰 카드, 오른쪽 아래), [2] 매장 입구(작은 카드) */
export const FAN_PHOTOS: Record<StoreId, FanPhoto[]> = {
  tokyo: [
    { src: "/images/stores/tokyo/draft-tap.jpg", cap: "산토리 프리미엄 생맥주 · 8,900원", pos: "50% 50%" },
    { src: "/images/stores/tokyo/cold-ham-plate-top.jpg", cap: "시그니처 콜드햄 플레이트 · 13,900원", pos: "50% 56%" },
    { src: "/images/stores/tokyo/hero.jpg", cap: "매장 입구", pos: "50% 50%" },
  ],
  joseon: [
    { src: "/images/stores/joseon/haemul-maeun-kalguksu.jpg", cap: "조선 해물매운칼국수 · 7,500원", pos: "50% 62%" },
    { src: "/images/stores/joseon/menu/joseon-makgeolli.jpg", cap: "조선막걸리 1통 · 5,500원", pos: "50% 45%" },
    { src: "/images/stores/joseon/exterior-sign-night.jpg", cap: "매장 입구", pos: "50% 55%" },
  ],
  wareureu: [
    { src: "/images/stores/wareureu/chadol-yukjeon.jpg", cap: "차돌육전 한 판 · 22,900원", pos: "50% 50%" },
    { src: "/images/stores/wareureu/bulsuji.jpg", cap: "와르르 키리모찌불스지 · 25,900원", pos: "50% 50%" },
    { src: "/images/stores/wareureu/exterior-sign-night.jpg", cap: "매장 입구", pos: "50% 50%" },
  ],
};

/** 매장 화면 폴라로이드 다섯 장 — [0] 대표 안주(한 줄 가득), [1]·[2] 안주·술(큰 카드), [3] 매장 안(작은 카드), [4] 매장 입구(작은 카드) */
export const STORE_FAN: Record<StoreId, FanPhoto[]> = {
  tokyo: [
    { src: "/images/stores/tokyo/cold-ham-plate-top.jpg", cap: "시그니처 콜드햄 플레이트 · 13,900원", pos: "50% 56%" },
    { src: "/images/stores/tokyo/wheat-beer.jpg", cap: "도쿄 윗 비어 · 8,900원", pos: "50% 50%" },
    { src: "/images/stores/tokyo/draft-tap.jpg", cap: "산토리 프리미엄 생맥주 · 8,900원", pos: "50% 50%" },
    { src: "/images/stores/tokyo/interior-keg-fridge.jpg", cap: "생맥주 대기실", pos: "50% 45%" },
    { src: "/images/stores/tokyo/hero.jpg", cap: "매장 입구", pos: "50% 50%" },
  ],
  joseon: [
    { src: "/images/stores/joseon/kimchi-jeon.jpg", cap: "조선 김치전 · 12,000원", pos: "50% 45%" },
    { src: "/images/stores/joseon/menu/haemul-pajeon.jpg", cap: "조선 해물파전 · 14,000원", pos: "50% 0%" },
    { src: "/images/stores/joseon/menu/joseon-makgeolli.jpg", cap: "조선막걸리 1통 · 5,500원", pos: "50% 45%" },
    { src: "/images/stores/joseon/interior-hall.jpg", cap: "1층 홀", pos: "50% 55%" },
    { src: "/images/stores/joseon/exterior-sign-night.jpg", cap: "매장 입구", pos: "50% 55%" },
  ],
  wareureu: [
    { src: "/images/stores/wareureu/bulsuji.jpg", cap: "와르르 키리모찌불스지 · 25,900원", pos: "50% 50%" },
    { src: "/images/stores/wareureu/menu/yukhoe-chadol-ssam.jpg", cap: "투뿔한우육회차돌쌈 · 29,900원", pos: "50% 50%" },
    { src: "/images/stores/wareureu/menu/kimchi-pizza-tangsuyuk.jpg", cap: "김치피자탕수육 · 18,500원", pos: "50% 50%" },
    { src: "/images/stores/wareureu/interior-hall.jpg", cap: "2층 홀", pos: "50% 50%" },
    { src: "/images/stores/wareureu/exterior-sign-night.jpg", cap: "매장 입구", pos: "50% 50%" },
  ],
};

/**
 * 캡션 "이름 · 값" 을 [이름, "· 값"] 로 — 큰 카드(390 화면 198px)보다 긴 캡션(가장 긴 것 227px)은 둘째 줄로 접히는데, 접히는 자리는 값 앞("· 13,900원" 이 한 덩어리)이지 값 안이 아니다.
 * 값이 없는 캡션("매장 입구")은 그대로.
 */
export function capParts(cap: string): [string, string | null] {
  const i = cap.indexOf(" · ");
  return i < 0 ? [cap, null] : [cap.slice(0, i), cap.slice(i + 1)];
}

/** 폴라로이드 사진의 alt — stores.ts 의 사진 설명이 있으면 그것, 없으면 캡션 */
export function photoAlt(images: { src: string; alt: string }[], p: FanPhoto): string {
  return images.find((im) => im.src === p.src)?.alt ?? p.cap;
}
