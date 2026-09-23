import assert from "node:assert/strict";
import { test } from "node:test";
import { adultBornOnOrBefore, birthYearOf, isAdultBirthYear, isAdultKr, koreanYear } from "./adult";

/**
 * 주류의 성인 기준은 만 나이가 아니다. 청소년보호법 제2조 제1호에 따라
 * "만 19세가 되는 해의 1월 1일"부터 청소년이 아니다 — 즉 연 나이로 따진다.
 * 여기서 만 나이로 계산하면 12월생 손님을 1년 내내 잘못 막는다.
 */
const NEW_YEAR_2026 = new Date("2026-01-01T00:00:00+09:00");
const DEC_2026 = new Date("2026-12-31T23:00:00+09:00");

test("생년월일에서 연도만 읽는다", () => {
  assert.equal(birthYearOf("1995-03-11"), 1995);
  assert.equal(birthYearOf(" 2007-12-31 "), 2007);
  assert.equal(birthYearOf("1995/03/11"), null);
  assert.equal(birthYearOf("19950311"), null);
  assert.equal(birthYearOf("1995-13-11"), null);
  assert.equal(birthYearOf("1995-03-32"), null);
  assert.equal(birthYearOf(""), null);
  assert.equal(birthYearOf(undefined), null);
  assert.equal(birthYearOf(null), null);
});

test("2026년에는 2007년생까지 성인이다", () => {
  assert.equal(adultBornOnOrBefore(NEW_YEAR_2026), 2007);
  assert.equal(isAdultKr("2007-01-01", NEW_YEAR_2026), true);
  assert.equal(isAdultKr("2007-12-31", NEW_YEAR_2026), true); // 12월생도 1월 1일부터 성인
  assert.equal(isAdultKr("2008-01-01", NEW_YEAR_2026), false);
  assert.equal(isAdultKr("2008-01-01", DEC_2026), false); // 해가 끝나도 2008년생은 아직 아니다
});

test("생일이 지나지 않아도 통과한다 — 만 나이로 세면 안 된다", () => {
  // 2007-12-31 생은 2026-01-01 시점 만 18세지만 법적으로 청소년이 아니다
  const 만나이 = 2026 - 2007 - 1;
  assert.equal(만나이, 18);
  assert.equal(isAdultKr("2007-12-31", NEW_YEAR_2026), true);
});

test("생년월일이 없거나 이상하면 성인으로 보지 않는다", () => {
  assert.equal(isAdultKr(undefined, NEW_YEAR_2026), false);
  assert.equal(isAdultKr("", NEW_YEAR_2026), false);
  assert.equal(isAdultKr("abcd-ef-gh", NEW_YEAR_2026), false);
  assert.equal(isAdultKr("0001-01-01", NEW_YEAR_2026), false);
});

test("출생연도만 넣어도 같은 판정이 나온다", () => {
  assert.equal(isAdultBirthYear(2007, NEW_YEAR_2026), true);
  assert.equal(isAdultBirthYear(1960, NEW_YEAR_2026), true);
  assert.equal(isAdultBirthYear(2008, DEC_2026), false);
  assert.equal(isAdultBirthYear(1899, NEW_YEAR_2026), false); // 잘못 친 연도
  assert.equal(isAdultBirthYear(2007.5, NEW_YEAR_2026), false);
  assert.equal(isAdultBirthYear(Number.NaN, NEW_YEAR_2026), false);
});

test("해가 바뀌는 순간은 한국 시각으로 센다", () => {
  // 한국 1월 1일 0시 30분 = UTC 로는 아직 12월 31일
  const kst0030 = new Date("2027-01-01T00:30:00+09:00");
  assert.equal(kst0030.getUTCFullYear(), 2026);
  assert.equal(koreanYear(kst0030), 2027);
  assert.equal(isAdultBirthYear(2008, kst0030), true);
  assert.equal(isAdultBirthYear(2008, new Date("2026-12-31T23:59:00+09:00")), false);
});
