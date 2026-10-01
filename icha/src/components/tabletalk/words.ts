/**
 * 테이블톡 화면의 말 — 한 곳에 모아 둔다. 사이트 말투(합니다체, 짧게, 느낌표·이모지 없음)를 따른다.
 */
import type { Msg, OutWhy } from "@/lib/tabletalk/types";

const KST_MS = 9 * 3600 * 1000;

/** 22:41 — 한국 시간. 서버(UTC)와 폰이 같은 글자를 그려야 화면이 처음 그린 그대로 이어진다 */
export function hhmm(isoText: string): string {
  const d = new Date(new Date(isoText).getTime() + KST_MS);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function ago(isoText: string, now: number): string {
  const s = Math.max(0, Math.floor((now - new Date(isoText).getTime()) / 1000));
  if (s < 60) return "방금";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  return hhmm(isoText);
}

/** 테이블톡에서 나가진 까닭 — 입장 화면 위 한 줄 */
export function whyText(why: OutWhy | null): string | null {
  switch (why) {
    case "day":
      return "어제 대화는 닫혔습니다. 오늘 대화를 새로 시작하세요.";
    case "new":
      return "이 테이블에 새 일행이 앉아 이전 대화가 닫혔습니다.";
    case "staff":
      return "직원이 이 테이블의 대화를 닫았습니다.";
    case "team":
      return "자리 떠나기로 대화를 닫았습니다.";
    case "idle":
      return "3시간 동안 아무도 보지 않아 대화가 닫혔습니다.";
    case "denied":
      return "일행이 들어오기를 허락하지 않았습니다.";
    case "expired":
      return "허락을 기다리는 시간(5분)이 지났습니다.";
    case "locked":
      return "이 테이블은 오늘 테이블톡이 막혀 있습니다.";
    case "off":
      return "이 가게는 지금 테이블톡을 쓰지 않습니다.";
    default:
      return null;
  }
}

/** 시스템 줄 — 보는 테이블 기준으로 말을 바꾼다 */
export function sysText(m: Msg, myTable: number): string {
  const who = m.sysTable;
  switch (m.sys) {
    case "start":
      return "대화가 시작됐습니다";
    case "left":
      return who === myTable ? "우리가 대화를 나갔습니다" : `${who}번 테이블이 대화를 나갔습니다`;
    case "gone":
      return who === myTable ? "우리가 자리를 떠났습니다" : `${who}번 테이블이 자리를 떠났습니다`;
    case "staff":
      return `직원이 ${who ?? ""}번 테이블을 비웠습니다`;
    case "end":
      return "대화가 끝났습니다";
    default:
      return "";
  }
}

/** 번호판 칸을 눌렀는데 말을 걸 수 없을 때 */
export const TILE_NOTE = {
  empty: (n: number) => `${n}번 테이블은 아직 테이블톡을 켜지 않았습니다.`,
  wait: (n: number) => `${n}번 테이블에는 15분 뒤에 다시 말을 걸 수 있습니다.`,
  off: (n: number) => `지금은 ${n}번 테이블에 말을 걸 수 없습니다.`,
} as const;
