import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isQrScanToken,
  QR_PLACE_DWELL_MS,
  QR_PLACE_MAX_LIFETIME_MS,
  QR_PLACE_URLS,
} from "./qr-traffic";

test("QR 트래픽 대상은 서로 다른 세 플레이스", () => {
  assert.deepEqual(QR_PLACE_URLS, [
    "https://m.place.naver.com/restaurant/2071490466/home",
    "https://m.place.naver.com/restaurant/32874065/home",
    "https://m.place.naver.com/restaurant/2013923953/home",
  ]);
  assert.equal(new Set(QR_PLACE_URLS).size, 3);
});

test("플레이스 문서는 10초보다 길게 유지한다", () => {
  assert.equal(QR_PLACE_DWELL_MS, 12_000);
  assert.ok(QR_PLACE_DWELL_MS > 10_000);
  assert.equal(QR_PLACE_MAX_LIFETIME_MS, 60_000);
  assert.ok(QR_PLACE_MAX_LIFETIME_MS > QR_PLACE_DWELL_MS);
});

test("QR 스캔 토큰은 UUID v4만 허용", () => {
  assert.equal(isQrScanToken("3f5e8c54-2ec0-4f6a-b7c0-c3986d4ca254"), true);
  assert.equal(isQrScanToken("not-a-token"), false);
});

