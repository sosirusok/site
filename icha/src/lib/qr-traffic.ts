export const QR_SCAN_PARAM = "qr_scan";

/** QR 스캔 1회마다 각각 한 번씩 호출할 참여 매장 네이버 플레이스. */
export const QR_PLACE_URLS = [
  "https://m.place.naver.com/restaurant/2071490466/home",
  "https://m.place.naver.com/restaurant/32874065/home",
  "https://m.place.naver.com/restaurant/2013923953/home",
] as const;

export function isQrScanToken(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
