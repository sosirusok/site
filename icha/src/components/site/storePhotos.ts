import type { StoreId } from "@/lib/config";

/**
 * 매장마다 "밤 골목" 한 장. 매장 화면 맨 위가 쓴다.
 */
export const NIGHT_PHOTO: Record<StoreId, { src: string; pos: string }> = {
  tokyo: { src: "/images/stores/tokyo/exterior-light-sign.jpg", pos: "50% 46%" },
  joseon: { src: "/images/stores/joseon/exterior-sign-night.jpg", pos: "50% 42%" },
  wareureu: { src: "/images/stores/wareureu/exterior-dusk.jpg", pos: "50% 38%" },
};

/** 매장 화면 맨 위 사진(store.images 의 hero)을 어디에 맞춰 자를지 */
export const HERO_POS: Record<StoreId, string> = {
  tokyo: "50% 64%",
  joseon: "50% 52%",
  wareureu: "50% 42%",
};

/** 폴라로이드 한 장 — 사진과 자르는 위치만. 캡션은 없다(사진 설명은 store.images 의 alt 로만). */
export type FanPhoto = { src: string; pos?: string };

/** 홈에서 매장마다 부채꼴로 붙이는 폴라로이드 세 장 — 술 한 잔, 안주 한 접시, 매장 한 컷 */
export const FAN_PHOTOS: Record<StoreId, FanPhoto[]> = {
  tokyo: [
    { src: "/images/stores/tokyo/draft-foam.jpg" },
    { src: "/images/stores/tokyo/cold-ham-plate-top.jpg" },
    { src: "/images/stores/tokyo/exterior-alley.jpg", pos: "50% 40%" },
  ],
  joseon: [
    { src: "/images/stores/joseon/makgeolli-2tong1ban.jpg" },
    { src: "/images/stores/joseon/haemul-pajeon.jpg" },
    { src: "/images/stores/joseon/hero.jpg", pos: "50% 55%" },
  ],
  wareureu: [
    { src: "/images/stores/wareureu/yukhoe-chadol-ssam.jpg" },
    { src: "/images/stores/wareureu/interior-stained-glass.jpg" },
    { src: "/images/stores/wareureu/exterior-sign-night.jpg", pos: "50% 35%" },
  ],
};

/** 매장 화면 폴라로이드 다섯 장 — 큰 것 둘(안주·술), 작은 것 셋(매장 안·밖) */
export const STORE_FAN: Record<StoreId, FanPhoto[]> = {
  tokyo: [
    { src: "/images/stores/tokyo/cold-ham-plate-beers.jpg" },
    { src: "/images/stores/tokyo/draft-tap.jpg" },
    { src: "/images/stores/tokyo/interior-counter.jpg" },
    { src: "/images/stores/tokyo/wheat-beer.jpg" },
    { src: "/images/stores/tokyo/exterior-window.jpg" },
  ],
  joseon: [
    { src: "/images/stores/joseon/modeum-jeon.jpg" },
    { src: "/images/stores/joseon/makgeolli-cheers.jpg" },
    { src: "/images/stores/joseon/interior-hall.jpg" },
    { src: "/images/stores/joseon/kalguksu.jpg" },
    { src: "/images/stores/joseon/entrance-garden.jpg" },
  ],
  wareureu: [
    { src: "/images/stores/wareureu/daechang-dakdoritang.jpg" },
    { src: "/images/stores/wareureu/chadol-yukjeon.jpg" },
    { src: "/images/stores/wareureu/interior-overview.jpg" },
    { src: "/images/stores/wareureu/muk-golbaengi.jpg" },
    { src: "/images/stores/wareureu/interior-booth.jpg" },
  ],
};
