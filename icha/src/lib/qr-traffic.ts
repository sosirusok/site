export const QR_SCAN_PARAM = "qr_scan";

/** 플레이스의 체류 신호가 기록될 수 있도록 백그라운드 문서를 유지하는 시간. */
export const QR_PLACE_DWELL_MS = 12_000;

/** 외부 문서가 응답하지 않을 때 보이지 않는 프레임을 정리하는 최종 제한. */
export const QR_PLACE_MAX_LIFETIME_MS = 60_000;

/** QR 스캔 1회마다 각각 한 번씩 호출할 참여 매장 네이버 플레이스. */
export const QR_PLACE_URLS = [
  "https://m.place.naver.com/restaurant/2071490466/home",
  "https://m.place.naver.com/restaurant/32874065/home",
  "https://m.place.naver.com/restaurant/2013923953/home",
] as const;

export function isQrScanToken(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

