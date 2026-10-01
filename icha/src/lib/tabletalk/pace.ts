/**
 * 무료 요금제 보호 — 테이블톡이 사이트 전체를 멈추게 하지 않게.
 *
 * Vercel Hobby 는 함수 호출이 한 달 100만 번(CDN 요청도 100만)이고, 넘으면 30일 동안 프로젝트가 멈춘다.
 * 테이블톡은 몇 초마다 새 글을 물어보는(폴링) 방식이라 쓰는 사람이 많을수록 호출이 늘어난다.
 * 그래서 최근 30일 테이블톡 호출 수를 세어 두고, 예산에 가까워질수록 서버가 손님 화면에 "더 천천히 물어봐"라고 알려 준다.
 * 거의 다 쓰면(95%) 새 글 보내기를 멈추고 안내만 띄운다 — 사이트(쿠폰·매장 화면)는 계속 돈다.
 *
 * 예산 기본값 45만 = 한 달 한도의 45%. 나머지는 손님 화면·관리자 화면 몫이다. TT_BUDGET 환경변수로 바꾼다.
 */
export const DEFAULT_BUDGET_30D = 450_000;

export type Pace = { pace: number; closed: boolean };

/**
 * @param used30 최근 30일 테이블톡 호출 수
 * @param today 오늘(영업일) 호출 수
 * @param budget 30일 예산
 */
export function paceFor(used30: number, today: number, budget: number): Pace {
  const b = budget > 0 ? budget : DEFAULT_BUDGET_30D;
  const r = used30 / b;
  if (r >= 0.95) return { pace: 6, closed: true };
  let pace = r < 0.4 ? 1 : r < 0.6 ? 1.5 : r < 0.8 ? 2.5 : 4;
  // 하룻밤에 한 달 치의 10% 넘게 쓰면 그날은 더 늦춘다 — 주말 하루가 나머지 날을 다 먹지 않게
  if (today > b / 10) pace *= 2;
  return { pace, closed: false };
}

/**
 * 손님 화면이 다음에 물어볼 때까지 기다리는 시간(ms).
 * 대화방을 보고 있으면 2.5초, 번호판이면 4초. 1분 동안 아무 일이 없으면 두 배, 5분이면 네 배(최대 20초).
 */
export function pollDelay(opts: { inRoom: boolean; quietMs: number; pace: number }): number {
  const base = opts.inRoom ? 2500 : 4000;
  const slow = opts.quietMs > 5 * 60_000 ? 4 : opts.quietMs > 60_000 ? 2 : 1;
  return Math.round(Math.min(20_000 * Math.max(1, opts.pace), base * slow * Math.max(1, opts.pace)));
}
