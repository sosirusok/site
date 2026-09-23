/**
 * 성인 여부 판정 — 청소년보호법 제2조 제1호 기준.
 *
 *   "청소년이란 만 19세 미만인 사람을 말한다.
 *    다만, 만 19세가 되는 해의 1월 1일을 맞이한 사람은 제외한다."
 *
 * 즉 주류에 적용되는 기준은 만 나이가 아니라 "연 나이"다. 2026년이면 2007년생부터 성인이고,
 * 2007년 12월 31일생도 2026년 1월 1일부터 술을 살 수 있다. 생일을 따지면 틀린다.
 */

/** 주류 기준 성년 나이 — 법이 바뀌면 여기만 고친다 */
export const ADULT_AGE = 19;

/**
 * 한국 기준 올해가 몇 년인지.
 *
 * 서버의 시간대로 세면 안 된다. Vercel 은 UTC 로 돈다 — 1월 1일 0시부터 9시까지(한국 시각)는
 * 서버가 아직 작년이라고 답하고, 그 아홉 시간 동안 그 해에 막 성인이 된 손님이 부당하게 막힌다.
 * 한국은 서머타임이 없으므로 UTC+9 를 그대로 더해 읽으면 된다.
 */
export function koreanYear(now: Date): number {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCFullYear();
}

/** PG 가 주는 생년월일은 yyyy-MM-dd. 그 해만 떼어 낸다. 형식이 다르면 null */
export function birthYearOf(birthDate: string | undefined | null): number | null {
  if (!birthDate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isInteger(y) || y < 1900 || y > 2200) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return y;
}

/** 출생연도만으로 판정한다 — 연 나이라 월·일은 결과를 바꾸지 않는다. 있을 수 없는 해는 성인으로 보지 않는다 */
export function isAdultBirthYear(year: number, now: Date): boolean {
  return Number.isInteger(year) && year >= 1900 && year <= koreanYear(now) - ADULT_AGE;
}

/** 오늘(now) 기준으로 술을 마실 수 있는 나이인가 */
export function isAdultKr(birthDate: string | undefined | null, now: Date): boolean {
  const year = birthYearOf(birthDate);
  if (year == null) return false;
  return isAdultBirthYear(year, now);
}

/** 안내 문구용 — 올해 기준 몇 년생부터 입장 가능한지 */
export function adultBornOnOrBefore(now: Date): number {
  return koreanYear(now) - ADULT_AGE;
}
