import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "./route";

test("공용 QR이 홈페이지로 이동", () => {
  const response = GET(new Request("https://icha-five.vercel.app/go"));

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://icha-five.vercel.app/");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});
