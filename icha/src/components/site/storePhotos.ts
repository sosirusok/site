import type { StoreId } from "@/lib/config";

/**
 * 가게마다 "밤 골목" 한 장. 홈의 1차·2차·3차 사진과 '다음 집' 사진이 같은 사진을 쓴다.
 * (가게 화면 맨 위는 store.images 의 hero 를 쓴다 — 같은 집이라도 사진이 겹치지 않게)
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
