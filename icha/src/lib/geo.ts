/** 위치 계산 — 거리(m), 도보 시간(분), 서면역 기준점 */
export type LatLng = { lat: number; lng: number };

/** 서면역(부산 1·2호선) 대략 중심 */
export const SEOMYEON_STATION: LatLng & { name: string } = { name: "서면역", lat: 35.15774, lng: 129.05946 };

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 도보 분 (약 4km/h, 골목 우회 20% 가산) */
export function walkMinutes(m: number): number {
  return Math.max(1, Math.round((m * 1.2) / 67));
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;
}

/** 네이버 지도 길찾기(도보) 웹 링크 */
export function naverWalkUrl(to: LatLng & { name: string }): string {
  return `https://map.naver.com/p/directions/-/${to.lng},${to.lat},${encodeURIComponent(to.name)}/-/walk`;
}

/** 카카오맵 장소 보기(좌표) */
export function kakaoMapUrl(to: LatLng & { name: string }): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(to.name)},${to.lat},${to.lng}`;
}

export function googleMapUrl(to: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${to.lat},${to.lng}`;
}
