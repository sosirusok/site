/**
 * 테이블톡 — 서버가 손님 화면에 주는 모양. 서버 코드를 끌어오지 않는 순수 타입(클라이언트도 import 한다).
 *
 * 말 정리:
 *  - 자리(seat): 한 테이블에 앉은 일행. QR 을 처음 찍은 폰이 연다. 같은 테이블 폰들이 한 자리를 같이 쓴다.
 *  - 신청(ask): 우리 자리 → 다른 자리 "대화하자". 상대가 수락하면 대화방이 열린다.
 *  - 대화방(room): 두 자리(두 테이블)의 단체 대화. 양쪽 테이블 폰 모두가 같이 본다.
 */
import type { StoreId } from "@/lib/config";

/**
 * 번호판 한 칸의 상태(보는 테이블 기준)
 *  me 우리 · empty 아무도 안 켬 · on 말 걸 수 있음 · sent 우리가 신청함 · got 상대가 신청함
 *  talk 대화 중 · wait 방금 끝나 잠시 못 검 · off 막힘(차단·직원이 막음)
 */
export type TileState = "me" | "empty" | "on" | "sent" | "got" | "talk" | "wait" | "off";

export type Tile = { no: number; state: TileState; room?: string; ask?: string };

export type AskIn = { id: string; from: number; note: string | null; at: string };
export type AskOut = { id: string; to: number; at: string };

/** 대화방 끝난 까닭 — left 한쪽이 나감 · gone 자리를 떠남 · end 차단·신고(어느 쪽인지 밝히지 않는다) · staff 직원이 닫음 */
export type CloseReason = "left" | "gone" | "end" | "staff";

export type Room = {
  id: string;
  with: number;
  open: boolean;
  /** 닫혔을 때만 */
  reason?: CloseReason;
  /** 닫은 쪽이 우리였나 */
  byUs?: boolean;
  at: string;
  /** 이 방의 마지막 글 번호(안 읽은 수 셈) */
  last: number;
};

/** 시스템 줄 — start 대화 시작 · left/gone 나감(table 은 누가) · end 끝남 · staff 직원이 닫음 */
export type SysKind = "start" | "left" | "gone" | "end" | "staff";

export type Msg = {
  id: number;
  room: string;
  /** 우리 테이블(어느 폰이든)이 보낸 글 */
  mine: boolean;
  body: string;
  at: string;
  nonce?: string;
  sys?: SysKind;
  /** sys 가 left/gone 일 때 나간 테이블 번호 */
  sysTable?: number;
};

/** 들어오겠다는 우리 테이블 새 폰 */
export type JoinWait = { id: string; at: string };

export type TTState = {
  v: number;
  store: StoreId;
  storeName: string;
  table: number;
  since: string;
  phones: number;
  tiles: Tile[];
  asks: AskIn[];
  sent: AskOut[];
  rooms: Room[];
  /** after 보다 뒤의 글만 */
  msgs: Msg[];
  joins: JoinWait[];
};

/** 손님 화면이 받는 응답 하나 — 무엇이든 이 모양 중 하나 */
export type Sync =
  | { kind: "state"; state: TTState; pace: number; closed: boolean }
  | { kind: "same"; v: number; pace: number; closed: boolean }
  /** 우리 테이블 폰의 허락을 기다리는 중 */
  | { kind: "waiting"; store: StoreId; storeName: string; table: number; since: string; pace: number }
  /** 이 폰은 테이블톡에 없다(처음·나감·자리 끝남·허락 안 됨) */
  | { kind: "out"; why: OutWhy };

export type OutWhy = "none" | "self" | "team" | "staff" | "idle" | "day" | "new" | "denied" | "expired" | "locked" | "off";

/** start 열린 자리가 없을 때 [테이블톡 시작] · team [일행으로 들어가기] · fresh [방금 이 자리에 앉았습니다] */
export type JoinMode = "start" | "team" | "fresh";

/** 입장 화면이 알아야 하는 것 — QR 을 열었을 때 서버가 미리 채운다 */
export type Entry =
  | { kind: "bad" }
  | { kind: "off"; storeName: string }
  | { kind: "locked"; storeName: string; table: number }
  | {
      kind: "join";
      code: string;
      store: StoreId;
      storeName: string;
      table: number;
      /** 이 테이블에 이미 열린 자리 — 있으면 일행으로 들어가거나 새로 시작한다 */
      existing: { since: string; fresh: boolean; quiet: boolean } | null;
      /** 이 폰이 다른 테이블에 들어가 있다면 그 번호 */
      elsewhere: { storeName: string; table: number } | null;
      /** 지난번에 왜 나가졌는지(있으면 한 줄 알림) */
      why: OutWhy | null;
    }
  | { kind: "in"; code: string; sync: Sync };
