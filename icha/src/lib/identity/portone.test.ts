import assert from "node:assert/strict";
import test from "node:test";
import { newVerificationId } from "./portone";

test("본인인증 건 ID 는 KCP 제약(영문·숫자 40자 이하)을 지킨다", () => {
  for (let i = 0; i < 200; i++) {
    const id = newVerificationId();
    assert.match(id, /^[A-Za-z0-9]+$/, `영숫자만 허용: ${id}`);
    assert.ok(id.length <= 40, `40자 이하: ${id.length}자`);
  }
});

test("본인인증 건 ID 는 매번 다르다", () => {
  const seen = new Set(Array.from({ length: 500 }, newVerificationId));
  assert.equal(seen.size, 500);
});
