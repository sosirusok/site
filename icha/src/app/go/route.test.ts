import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "./route";

const cases = [
  [0, "https://m.place.naver.com/restaurant/2071490466/home"],
  [0.34, "https://m.place.naver.com/restaurant/32874065/home"],
  [0.99, "https://m.place.naver.com/restaurant/2013923953/home"],
] as const;

for (const [random, expected] of cases) {
  test(`공용 QR이 난수 ${random}에서 올바른 플레이스로 이동`, (t) => {
    t.mock.method(Math, "random", () => random);

    const response = GET();

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), expected);
    assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  });
}

