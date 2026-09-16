import type { StoreId } from "@/lib/config";

/**
 * 가게마다 "밤 골목" 한 장. 홈의 '다음 집'과 가게 화면 맨 위가 쓴다.
 */
export const NIGHT_PHOTO: Record<StoreId, { src: string; pos: string }> = {
  tokyo: { src: "/images/stores/tokyo/exterior-light-sign.jpg", pos: "50% 46%" },
  joseon: { src: "/images/stores/joseon/exterior-sign-night.jpg", pos: "50% 42%" },
  wareureu: { src: "/images/stores/wareureu/exterior-dusk.jpg", pos: "50% 38%" },
};

/** 가게 화면 맨 위 사진(store.images 의 hero)을 어디에 맞춰 자를지 */
export const HERO_POS: Record<StoreId, string> = {
  tokyo: "50% 64%",
  joseon: "50% 52%",
  wareureu: "50% 42%",
};

export type FanPhoto = { src: string; cap: string; pos?: string };

/** 홈에서 가게마다 부채꼴로 붙이는 폴라로이드 세 장 — 술 한 잔, 안주 한 접시, 가게 한 컷. 손글씨 캡션은 짧게. */
export const FAN_PHOTOS: Record<StoreId, FanPhoto[]> = {
  tokyo: [
    { src: "/images/stores/tokyo/draft-foam.jpg", cap: "산토리 생맥주" },
    { src: "/images/stores/tokyo/cold-ham-plate-top.jpg", cap: "콜드햄 플레이트" },
    { src: "/images/stores/tokyo/exterior-alley.jpg", cap: "골목의 파란 간판", pos: "50% 40%" },
  ],
  joseon: [
    { src: "/images/stores/joseon/makgeolli-2tong1ban.jpg", cap: "막걸리 2통1반" },
    { src: "/images/stores/joseon/haemul-pajeon.jpg", cap: "해물파전" },
    { src: "/images/stores/joseon/hero.jpg", cap: "통나무집 밤", pos: "50% 55%" },
  ],
  wareureu: [
    { src: "/images/stores/wareureu/yukhoe-chadol-ssam.jpg", cap: "육회차돌쌈" },
    { src: "/images/stores/wareureu/interior-stained-glass.jpg", cap: "스테인드글라스" },
    { src: "/images/stores/wareureu/exterior-sign-night.jpg", cap: "2층 초록 간판", pos: "50% 35%" },
  ],
};

/** 가게 화면 폴라로이드 다섯 장 — 큰 것 둘(안주·술), 작은 것 셋(가게 안·밖) */
export const STORE_FAN: Record<StoreId, FanPhoto[]> = {
  tokyo: [
    { src: "/images/stores/tokyo/cold-ham-plate-beers.jpg", cap: "생맥주 둘, 콜드햄" },
    { src: "/images/stores/tokyo/draft-tap.jpg", cap: "탭에서 바로" },
    { src: "/images/stores/tokyo/interior-counter.jpg", cap: "카운터" },
    { src: "/images/stores/tokyo/wheat-beer.jpg", cap: "도쿄 윗 비어" },
    { src: "/images/stores/tokyo/exterior-window.jpg", cap: "유리창 곰" },
  ],
  joseon: [
    { src: "/images/stores/joseon/modeum-jeon.jpg", cap: "모듬전" },
    { src: "/images/stores/joseon/makgeolli-cheers.jpg", cap: "건배!" },
    { src: "/images/stores/joseon/interior-hall.jpg", cap: "1층 홀" },
    { src: "/images/stores/joseon/kalguksu.jpg", cap: "조선 칼국수" },
    { src: "/images/stores/joseon/entrance-garden.jpg", cap: "장승 있는 입구" },
  ],
  wareureu: [
    { src: "/images/stores/wareureu/daechang-dakdoritang.jpg", cap: "한우대창묵도리탕" },
    { src: "/images/stores/wareureu/chadol-yukjeon.jpg", cap: "차돌육전" },
    { src: "/images/stores/wareureu/interior-overview.jpg", cap: "홀 전경" },
    { src: "/images/stores/wareureu/muk-golbaengi.jpg", cap: "묵골뱅이" },
    { src: "/images/stores/wareureu/interior-booth.jpg", cap: "부스 자리" },
  ],
};
