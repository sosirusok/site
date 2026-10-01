import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "./route";

test("공용 QR이 일회성 토큰을 붙여 홈페이지로 이동", () => {
  const response = GET(new Request("https://icha-five.vercel.app/go"));
  const location = new URL(response.headers.get("location")!);

  assert.equal(response.status, 302);
  assert.equal(location.origin, "https://icha-five.vercel.app");
  assert.equal(location.pathname, "/");
  assert.equal(location.search, "");
  assert.match(
    new URLSearchParams(location.hash.slice(1)).get("qr_scan") ?? "",
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("QR 요청마다 서로 다른 토큰을 발급", () => {
  const request = new Request("https://icha-five.vercel.app/go");
  const firstLocation = new URL(GET(request).headers.get("location")!);
  const secondLocation = new URL(GET(request).headers.get("location")!);
  const first = new URLSearchParams(firstLocation.hash.slice(1)).get("qr_scan");
  const second = new URLSearchParams(secondLocation.hash.slice(1)).get("qr_scan");

  assert.notEqual(first, second);
});
