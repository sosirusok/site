import assert from "node:assert/strict";
import { test } from "node:test";
import { VERIFIER_APP, verifierAppUrl } from "./verifier-app";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";
const GALAXY = "Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36";

test("아이폰은 앱스토어, 안드로이드는 플레이스토어로 간다", () => {
  assert.equal(verifierAppUrl(IPHONE), VERIFIER_APP.ios);
  assert.equal(verifierAppUrl(GALAXY), VERIFIER_APP.android);
});

test("아이패드는 맥처럼 말해도 터치가 있으면 앱스토어", () => {
  assert.equal(verifierAppUrl(IPAD, 5), VERIFIER_APP.ios);
  assert.equal(verifierAppUrl(IPAD, 0), VERIFIER_APP.android); // 진짜 맥 — 폰 앱이라 어느 쪽이든 상관없다
});
