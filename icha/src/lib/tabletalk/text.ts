/**
 * 손님이 친 글 다듬기 — 화면에 그대로 찍히므로 여기서 한 번만 거른다(React 가 HTML 은 이스케이프한다).
 *  - 제어 문자, 폭 없는 문자, 방향 바꾸기 문자(남의 글처럼 꾸미는 데 쓰인다)를 지운다
 *  - 줄바꿈은 두 줄까지만, 앞뒤 공백은 자른다
 *  - 길이는 글자(코드 포인트) 수로 센다 — 이모지 하나가 둘로 세지지 않게
 */
export const MSG_MAX = 200;
export const NOTE_MAX = 60;

const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F­​-‏‪-‮⁠-⁩﻿]/g;

function clip(s: string, max: number): string {
  const chars = Array.from(s);
  return chars.length > max ? chars.slice(0, max).join("") : s;
}

export function cleanMessage(input: unknown): string {
  if (typeof input !== "string") return "";
  const s = input.replace(/\r\n?/g, "\n").replace(INVISIBLE, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return clip(s, MSG_MAX).trim();
}

/** 말 걸 때 붙이는 첫 마디 — 한 줄 */
export function cleanNote(input: unknown): string {
  if (typeof input !== "string") return "";
  const s = input.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  return clip(s, NOTE_MAX).trim();
}

/** 다시 보내기에 쓰는 클라이언트 표식 — 영문·숫자 8~40자만 */
export function cleanNonce(input: unknown): string | null {
  return typeof input === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(input) ? input : null;
}
