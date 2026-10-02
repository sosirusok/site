import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePhone } from "@/lib/config";
import { safeNext } from "./format";

test("safeNext: 같은 사이트 경로만 통과", () => {
  for (const ok of ["/wallet", "/pick/abc?x", "/coupons/1?a=1#b", "/login?next=%2Fwallet"]) assert.equal(safeNext(ok, "/f"), ok);
  for (const bad of ["//evil.example", "/\\/evil.example", "/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "https://evil.example", "evil", "", "/\u0000x"]) {
    assert.equal(safeNext(bad, "/f"), "/f", JSON.stringify(bad));
  }
  assert.equal(safeNext(undefined, "/f"), "/f");
  assert.equal(safeNext(["/wallet", "//evil"], "/f"), "/wallet");
  // 한 번 더 인코딩된 것은 경로 글자일 뿐 — 이 사이트 안에 머문다
  assert.equal(new URL(safeNext("/%09/evil.example", "/f"), "https://x.test").origin, "https://x.test");
});

test("normalizePhone: 국내 번호와 +82 자동 완성", () => {
  assert.equal(normalizePhone("010-1234-5678"), "01012345678");
  assert.equal(normalizePhone("011 234 5678"), "0112345678");
  assert.equal(normalizePhone("+82 10-1234-5678"), "01012345678");
  assert.equal(normalizePhone("+82 010-1234-5678"), "01012345678");
  assert.equal(normalizePhone("821012345678"), "01012345678");
  assert.equal(normalizePhone("02-123-4567"), null);
  assert.equal(normalizePhone("+82 2-123-4567"), null);
  assert.equal(normalizePhone("0101234"), null);
});
