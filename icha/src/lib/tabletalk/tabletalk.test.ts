import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTableCode, serviceDay, serviceDayEndsAt, tableCode } from "./code";
import { paceFor, pollDelay } from "./pace";
import { cleanMessage, cleanNonce, cleanNote, MSG_MAX } from "./text";

const gen1 = () => 1;

test("테이블 QR 주소는 서명이 맞아야 열린다", () => {
  const code = tableCode("tokyo", 7, 1);
  assert.match(code, /^tokyo-7-[0-9a-z]{6}$/);
  assert.deepEqual(parseTableCode(code, gen1), { store: "tokyo", table: 7 });
  assert.deepEqual(parseTableCode(code.toUpperCase(), gen1), { store: "tokyo", table: 7 }, "대문자로 옮겨 적어도");
  // 번호만 바꾸면 서명이 안 맞는다 — 한 테이블 QR 로 다른 테이블 주소를 지어낼 수 없다
  const forged = code.replace("tokyo-7-", "tokyo-8-");
  assert.equal(parseTableCode(forged, gen1), null);
  assert.equal(parseTableCode(code.replace("tokyo", "joseon"), gen1), null);
  // 판을 올리면 전에 인쇄한 QR 은 못 쓴다
  assert.equal(parseTableCode(code, () => 2), null);
  assert.equal(parseTableCode("tokyo-0-aaaaaa", gen1), null);
  assert.equal(parseTableCode("nowhere-1-aaaaaa", gen1), null);
  assert.equal(parseTableCode("tokyo-7", gen1), null);
});

test("테이블마다 QR 이 다르다", () => {
  const seen = new Set<string>();
  for (const s of ["tokyo", "joseon", "wareureu"] as const) for (let t = 1; t <= 40; t++) seen.add(tableCode(s, t, 1));
  assert.equal(seen.size, 120);
});

test("영업일은 한국 낮 12시에 바뀐다", () => {
  // 한국 10월 1일 23시 = 같은 영업일
  assert.equal(serviceDay(new Date("2026-10-01T23:00:00+09:00")), "2026-10-01");
  // 한국 10월 2일 새벽 5시(가게 마감 전) — 아직 10월 1일 영업일
  assert.equal(serviceDay(new Date("2026-10-02T05:00:00+09:00")), "2026-10-01");
  // 조선칼국수 금·토 마감 오전 10시 — 그래도 같은 영업일
  assert.equal(serviceDay(new Date("2026-10-03T09:59:00+09:00")), "2026-10-02");
  // 낮 12시에 넘어간다
  assert.equal(serviceDay(new Date("2026-10-02T11:59:00+09:00")), "2026-10-01");
  assert.equal(serviceDay(new Date("2026-10-02T12:00:00+09:00")), "2026-10-02");
  assert.equal(serviceDayEndsAt(new Date("2026-10-01T23:00:00+09:00")).toISOString(), new Date("2026-10-02T12:00:00+09:00").toISOString());
  assert.equal(serviceDayEndsAt(new Date("2026-10-02T12:00:00+09:00")).toISOString(), new Date("2026-10-03T12:00:00+09:00").toISOString());
});

test("글 다듬기", () => {
  assert.equal(cleanMessage("  안녕하세요  "), "안녕하세요");
  assert.equal(cleanMessage("a\n\n\n\nb"), "a\n\nb");
  assert.equal(cleanMessage("가‮나​다"), "가나다", "방향 바꾸기·폭 없는 문자");
  assert.equal(cleanMessage(123), "");
  assert.equal(Array.from(cleanMessage("😀".repeat(300))).length, MSG_MAX, "이모지도 한 글자로 센다");
  assert.equal(cleanNote("  같이\n한잔   해요 "), "같이 한잔 해요");
  assert.equal(cleanNonce("abcDEF12_-"), "abcDEF12_-");
  assert.equal(cleanNonce("짧"), null);
  assert.equal(cleanNonce("<script>alert(1)</script>"), null);
});

test("예산에 가까워질수록 천천히, 거의 다 쓰면 멈춘다", () => {
  const B = 450_000;
  assert.deepEqual(paceFor(0, 0, B), { pace: 1, closed: false });
  assert.deepEqual(paceFor(B * 0.5, 0, B), { pace: 1.5, closed: false });
  assert.deepEqual(paceFor(B * 0.7, 0, B), { pace: 2.5, closed: false });
  assert.deepEqual(paceFor(B * 0.9, 0, B), { pace: 4, closed: false });
  assert.equal(paceFor(B * 0.96, 0, B).closed, true);
  // 하룻밤에 한 달 치 10% 를 넘기면 그날은 두 배로 늦춘다
  assert.deepEqual(paceFor(B * 0.2, B * 0.11, B), { pace: 2, closed: false });
});

test("묻는 간격", () => {
  assert.equal(pollDelay({ inRoom: true, quietMs: 0, pace: 1 }), 2500);
  assert.equal(pollDelay({ inRoom: false, quietMs: 0, pace: 1 }), 4000);
  assert.equal(pollDelay({ inRoom: false, quietMs: 2 * 60_000, pace: 1 }), 8000);
  assert.equal(pollDelay({ inRoom: false, quietMs: 10 * 60_000, pace: 1 }), 16000);
  assert.equal(pollDelay({ inRoom: true, quietMs: 10 * 60_000, pace: 4 }), 40000);
  assert.ok(pollDelay({ inRoom: false, quietMs: 10 * 60_000, pace: 1 }) <= 20000);
});
