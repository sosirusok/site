/**
 * 사장님이 보낸 일러스트 자산. scripts/import-art.mjs 가 public/art/ 와 art-manifest.json 을 만든다.
 */
import manifest from "./art-manifest.json";

export type ArtName = keyof typeof manifest;
export type Art = { src: string; width: number; height: number };

const M = manifest as Record<string, Art>;

export function art(name: ArtName | string): Art {
  const a = M[name as string];
  if (!a) throw new Error(`art asset not found: ${name}`);
  return a;
}

export function hasArt(name: string): boolean {
  return Boolean(M[name]);
}

/** 버튼 자산 이름: 시작하기/영수증 촬영/사진 선택/메뉴 보기/혜택 선택/쿠폰 받기/사용하기 */
export type ArtButtonKey = "start" | "shoot" | "pick-photo" | "menu" | "choose" | "get-coupon" | "use";
export type ArtButtonState = "default" | "pressed" | "loading" | "disabled";

export function artButton(key: ArtButtonKey, state: ArtButtonState = "default"): Art {
  return art(`btn-${key}-${state}`);
}
