/**
 * 네이버 플레이스 연결 — 이 사이트의 주목적은 플레이스 방문(트래픽)이다.
 * 휴대폰에서는 m.place.naver.com 주소가 네이버 앱/모바일 플레이스로 바로 열린다.
 */
import type { Store } from "./stores";

export type PlaceLinks = { home: string; review: string; photo: string; menu: string; directions: string; save: string };

export function placeLinks(s: Pick<Store, "naverPlaceId" | "name" | "lat" | "lng">): PlaceLinks | null {
  if (!s.naverPlaceId) return null;
  const base = `https://m.place.naver.com/restaurant/${s.naverPlaceId}`;
  const q = encodeURIComponent(s.name);
  return {
    home: `${base}/home`,
    review: `${base}/review/visitor`,
    photo: `${base}/photo`,
    menu: `${base}/menu/list`,
    directions: s.lat != null && s.lng != null ? `https://map.naver.com/p/directions/-/${s.lng},${s.lat},${q}/-/walk` : `${base}/location`,
    save: `${base}/home?entry=pll`,
  };
}
