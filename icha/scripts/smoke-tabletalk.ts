/**
 * 테이블톡 DB 스모크 테스트 (메모리 PGlite). `PGLITE_MEMORY=1 npx tsx scripts/smoke-tabletalk.ts`
 * 폰 여러 대가 같은 가게에서 입장·말 걸기·수락·대화·나가기·차단·신고·허락·새로 앉기·영업일 넘김을 실제 SQL 로 해 본다.
 */
process.env.PGLITE_MEMORY = "1";
process.env.ADMIN_INITIAL_PASSWORD = "test-pw";
import assert from "node:assert/strict";
import { getDb, query } from "../src/lib/db";
import {
  adminClear, adminLock, adminView, answer, ask, cancelAsk, closeRoom, endTeam, join, leaveDevice, refuseAsk, send, sync, admit, purgeTableTalk, TTError, type SyncOut,
} from "../src/lib/tabletalk/service";
import { saveTTStore } from "../src/lib/tabletalk/settings";
import type { TTState } from "../src/lib/tabletalk/types";

const T3 = { store: "tokyo" as const, table: 3 };
const T7 = { store: "tokyo" as const, table: 7 };
const T9 = { store: "tokyo" as const, table: 9 };

async function state(dev: string, now?: Date): Promise<TTState> {
  const s = await sync(dev, -1, 0, now);
  if (s.kind !== "state") throw new Error(`state 가 아님: ${JSON.stringify(s)}`);
  return s.state;
}
const tile = (s: TTState, no: number) => s.tiles.find((t) => t.no === no)?.state;
async function rejects(p: Promise<unknown>, code: string): Promise<void> {
  try {
    await p;
  } catch (e) {
    assert.ok(e instanceof TTError, `TTError 가 아님: ${e}`);
    assert.equal(e.code, code, `코드 ${e.code} ≠ ${code} (${e.message})`);
    return;
  }
  assert.fail(`거절되어야 함: ${code}`);
}

async function main() {
  await getDb();
  await saveTTStore("tokyo", { on: true, tables: 12 });

  // ── 3번 테이블: 처음 찍은 폰이 자리를 연다, 5분 안에 찍은 일행은 바로 들어온다
  const a = await join(T3, "start", null);
  assert.equal(a.status, "in");
  const b = await join(T3, "team", null);
  assert.equal(b.status, "in", "5분 안 일행은 바로");
  const again = await join(T3, "start", a.dev);
  assert.equal(again.dev, a.dev, "이미 들어와 있으면 같은 폰");
  let sa = await state(a.dev);
  assert.equal(sa.phones, 2);
  assert.equal(sa.tiles.length, 12);
  assert.equal(tile(sa, 3), "me");
  assert.equal(tile(sa, 7), "empty");

  // ── 7번 테이블
  const c = await join(T7, "start", null);
  sa = await state(a.dev);
  assert.equal(tile(sa, 7), "on", "7번에 불이 들어온다");

  // 변경 번호가 같으면 한 줄로 끝난다
  const same = await sync(a.dev, sa.v, 0);
  assert.equal(same.kind, "same");

  // ── 말 걸기 → 수락
  await ask(a.dev, 7, "  같이   한잔 해요 ");
  let sc = await state(c.dev);
  assert.equal(sc.asks.length, 1);
  assert.equal(sc.asks[0]!.from, 3);
  assert.equal(sc.asks[0]!.note, "같이 한잔 해요");
  assert.equal(tile(sc, 3), "got");
  assert.equal(tile(await state(b.dev), 7), "sent", "일행 폰에도 신청함으로");
  await ask(a.dev, 7, "두 번 눌러도"); // 같은 신청은 하나만
  assert.equal((await state(c.dev)).asks.length, 1);
  await answer(c.dev, sc.asks[0]!.id, true);
  await answer(c.dev, sc.asks[0]!.id, true); // 일행이 같이 눌러도 한 번만
  sa = await state(a.dev);
  assert.equal(sa.rooms.length, 1);
  const room = sa.rooms[0]!;
  assert.equal(room.with, 7);
  assert.equal(room.open, true);
  assert.equal(tile(sa, 7), "talk");
  assert.equal(sa.msgs.filter((m) => m.sys === "start").length, 1, "시작 줄 하나");

  // ── 대화: 같은 nonce 는 한 번만, 우리 테이블 글은 어느 폰이든 mine
  await send(a.dev, room.id, "안녕하세요", "nonce-aaaa-1");
  await send(a.dev, room.id, "안녕하세요", "nonce-aaaa-1");
  await send(c.dev, room.id, "반가워요\n\n\n\n여기 7번", "nonce-cccc-1");
  const sb = await state(b.dev);
  const texts = sb.msgs.filter((m) => !m.sys);
  assert.equal(texts.length, 2, "다시 보내도 두 번 안 들어간다");
  assert.equal(texts[0]!.mine, true, "일행(b)에게도 우리 글");
  assert.equal(texts[1]!.mine, false);
  assert.equal(texts[1]!.body, "반가워요\n\n여기 7번");
  const lastId = texts[1]!.id;
  const inc = await sync(b.dev, -1, lastId);
  assert.ok(inc.kind === "state" && inc.state.msgs.length === 0, "after 뒤의 글만");
  await rejects(send(a.dev, room.id, "   ", "nonce-empty-1"), "bad");

  // ── 나가기 → 15분은 다시 못 건다
  await closeRoom(c.dev, room.id, "leave");
  sa = await state(a.dev);
  assert.equal(sa.rooms[0]!.open, false);
  assert.equal(sa.rooms[0]!.reason, "left");
  assert.equal(tile(sa, 7), "wait");
  await rejects(ask(a.dev, 7, ""), "wait");
  await rejects(send(a.dev, room.id, "닫힌 방", "nonce-closed-1"), "closed");

  // ── 9번이 3번에게 → 수락 → 9번이 신고(차단 포함)
  const d = await join(T9, "start", null);
  await ask(d.dev, 3, "");
  sa = await state(a.dev);
  await answer(a.dev, sa.asks[0]!.id, true);
  const room9 = (await state(d.dev)).rooms.find((r) => r.with === 3)!;
  await send(a.dev, room9.id, "문제 될 말", "nonce-bad-001");
  await closeRoom(d.dev, room9.id, "report");
  sa = await state(a.dev);
  assert.equal(tile(sa, 9), "off", "신고·차단된 쪽에서도 막힘");
  assert.equal(sa.rooms.find((r) => r.id === room9.id)!.reason, "end", "누가 막았는지 밝히지 않는다");
  await rejects(ask(a.dev, 9, ""), "off");
  const view = await adminView("tokyo");
  assert.equal(view.reports.length, 1);
  assert.equal(view.reports[0]!.onTable, 3);
  assert.equal(view.reports[0]!.lines.at(-1)!.body, "문제 될 말");

  // ── 거절과 취소
  const e9 = await join({ store: "tokyo", table: 11 }, "start", null);
  await ask(e9.dev, 7, "");
  let s7 = await state(c.dev);
  await answer(c.dev, s7.asks.find((x) => x.from === 11)!.id, false);
  await rejects(ask(e9.dev, 7, ""), "wait");
  await ask(c.dev, 11, "그럼 우리가");
  const s11 = await state(e9.dev);
  assert.equal(s11.asks.length, 1, "거절한 쪽은 걸 수 있다");
  await cancelAsk(c.dev, (await state(c.dev)).sent[0]!.id);
  assert.equal((await state(e9.dev)).asks.length, 0);

  // ── 서로 신청하면 바로 열린다
  const f = await join({ store: "tokyo", table: 12 }, "start", null);
  await ask(f.dev, 7, "");
  await ask(c.dev, 12, "");
  s7 = await state(c.dev);
  assert.ok(s7.rooms.some((r) => r.with === 12 && r.open), "서로 원하면 방이 바로");
  assert.equal(s7.asks.filter((x) => x.from === 12).length, 0);

  // ── 늦게 온 폰은 일행이 허락해야 들어온다
  await query(`update tt_seats set started_at = now() - interval '20 minutes' where store_id='tokyo' and table_no=3 and status='on'`);
  const late = await join(T3, "team", null);
  assert.equal(late.status, "wait");
  const w = await sync(late.dev, -1, 0);
  assert.equal(w.kind, "waiting");
  await rejects(ask(late.dev, 7, ""), "waiting");
  sa = await state(a.dev);
  assert.equal(sa.joins.length, 1);
  await admit(a.dev, sa.joins[0]!.id, true);
  assert.equal((await state(late.dev)).table, 3, "허락되면 들어온다");
  const late2 = await join(T3, "team", null);
  await admit(b.dev, late2.dev, false);
  const denied = (await sync(late2.dev, -1, 0)) as SyncOut;
  assert.deepEqual(denied, { kind: "out", why: "denied" });

  // ── [방금 앉았습니다]: 누가 보고 있으면 안 되고, 20분 넘게 아무도 안 봤으면 이전 자리를 닫고 새로
  await rejects(join(T3, "fresh", null), "busy");
  await rejects(join(T3, "start", null), "exists");
  await query(`update tt_seats set seen_at = now() - interval '11 minutes' where store_id='tokyo' and table_no=3 and status='on'`);
  await rejects(join(T3, "fresh", null), "busy");
  await query(`update tt_seats set seen_at = now() - interval '21 minutes' where store_id='tokyo' and table_no=3 and status='on'`);
  const newGroup = await join(T3, "fresh", null);
  assert.equal(newGroup.status, "in");
  assert.deepEqual(await sync(a.dev, -1, 0), { kind: "out", why: "new" }, "이전 일행 폰은 나가진다");
  const s9 = await state(d.dev);
  assert.equal(tile(s9, 3), "on", "새 일행에게는 차단이 따라가지 않는다");

  // ── 자리 떠나기: 상대 방에 '자리를 떠났습니다'
  await endTeam(f.dev);
  s7 = await state(c.dev);
  const r12 = s7.rooms.find((r) => r.with === 12)!;
  assert.equal(r12.open, false);
  assert.equal(r12.reason, "gone");
  assert.ok(s7.msgs.some((m) => m.sys === "gone" && m.sysTable === 12));
  assert.deepEqual(await sync(f.dev, -1, 0), { kind: "out", why: "team" });

  // ── 마지막 폰이 나가면 자리도 끝난다
  await leaveDevice(e9.dev);
  assert.equal(tile(await state(c.dev), 11), "empty");

  // ── 직원: 잠그기 → 그 테이블은 못 들어오고, 열린 자리는 비워진다
  await adminLock("tokyo", 7, true, "owner");
  assert.deepEqual(await sync(c.dev, -1, 0), { kind: "out", why: "staff" });
  await rejects(join(T7, "start", null), "locked");
  await adminLock("tokyo", 7, false, "owner");
  const c2 = await join(T7, "start", null);
  assert.equal(c2.status, "in");
  assert.equal(await adminClear("tokyo", 7), true);
  assert.equal(await adminClear("tokyo", 7), false);

  // ── 다른 테이블 QR 을 찍으면 옮겨 간다(혼자였으면 이전 자리는 끝)
  const solo = await join({ store: "tokyo", table: 5 }, "start", null);
  const moved = await join({ store: "tokyo", table: 6 }, "start", solo.dev);
  assert.notEqual(moved.dev, solo.dev);
  assert.deepEqual(await sync(solo.dev, -1, 0), { kind: "out", why: "self" });
  assert.equal(tile(await state(moved.dev), 5), "empty");

  // ── 영업일이 바뀌면(한국 낮 12시) 전부 끝난다
  await query(`update tt_state set swept_at = null`);
  const tomorrow = new Date(Date.now() + 26 * 3600 * 1000);
  assert.deepEqual(await sync(moved.dev, -1, 0, tomorrow), { kind: "out", why: "day" });
  const fresh = await join(T3, "start", null, tomorrow);
  assert.equal(fresh.status, "in", "다음 영업일에는 새 자리");

  // ── 끄면 못 들어온다
  await saveTTStore("tokyo", { on: false });
  await rejects(join(T9, "start", null), "off");
  await saveTTStore("tokyo", { on: true });

  // ── 자리마다 변경 번호: 남의 테이블끼리 대화해도 우리 번호는 그대로(조용하면 늦게 묻는 게 먹힌다)
  await saveTTStore("joseon", { on: true, tables: 12 });
  const J = (table: number) => ({ store: "joseon" as const, table });
  const j1 = await join(J(1), "start", null);
  const j2 = await join(J(2), "start", null);
  const lone = await join(J(9), "start", null);
  await ask(j1.dev, 2, "");
  await answer(j2.dev, (await state(j2.dev)).asks[0]!.id, true);
  const jr = (await state(j1.dev)).rooms[0]!;
  const sl = await state(lone.dev);
  const v2 = (await state(j2.dev)).v;
  await send(j1.dev, jr.id, "둘이서만", "nonce-j1-0001");
  assert.equal((await sync(lone.dev, sl.v, 0)).kind, "same", "남의 대화로 우리 번호가 바뀌지 않는다");
  assert.equal((await sync(j2.dev, v2, 0)).kind, "state", "대화 상대는 새로 받는다");
  const j5 = await join(J(5), "start", null);
  assert.equal((await sync(lone.dev, sl.v, 0)).kind, "state", "새 테이블이 켜지면 모두 새로 받는다");

  // ── 받은 신청에서 신고(차단 포함): 방이 없어도 막히고 첫 마디가 직원에게 간다
  await ask(j5.dev, 9, "이상한 첫 마디");
  await refuseAsk(lone.dev, (await state(lone.dev)).asks[0]!.id, "report");
  assert.equal(tile(await state(j5.dev), 9), "off");
  assert.equal(tile(await state(lone.dev), 5), "off");
  assert.equal((await state(lone.dev)).asks.length, 0);
  const rep5 = (await adminView("joseon")).reports.find((r) => r.onTable === 5)!;
  assert.equal(rep5.lines[0]!.body, "이상한 첫 마디", "신고에 첫 마디가 간다");
  // 막힌 쪽이 [자리 떠나기] 뒤 다시 찍어도 막혀 있다
  await endTeam(j5.dev);
  const j5b = await join(J(5), "start", null);
  await rejects(ask(j5b.dev, 9, "또"), "off");
  assert.equal(tile(await state(lone.dev), 5), "off");
  // 직원이 5번을 비우면 다른 손님으로 보고 풀린다
  assert.equal(await adminClear("joseon", 5), true);
  const j5c = await join(J(5), "start", null);
  await ask(j5c.dev, 9, "");
  assert.equal(tile(await state(lone.dev), 5), "got");

  // ── 취소한 신청도 15분 동안 다시 못 건다(취소·재신청으로 괴롭히지 못하게)
  await ask(j1.dev, 9, "");
  await cancelAsk(j1.dev, (await state(j1.dev)).sent.find((x) => x.to === 9)!.id);
  await rejects(ask(j1.dev, 9, ""), "wait");
  assert.equal(tile(await state(j1.dev), 9), "wait");

  // ── 수락하는 사이 신청한 자리가 끝났으면 신청을 거둔다(던져도 거둔 것은 남는다)
  const j7 = await join(J(7), "start", null);
  await ask(j7.dev, 9, "");
  const ask7 = (await state(lone.dev)).asks.find((x) => x.from === 7)!.id;
  await query(`update tt_seats set day = day - 1 where store_id='joseon' and table_no=7 and status='on'`);
  await rejects(answer(lone.dev, ask7, true), "gone");
  assert.equal((await query<{ status: string }>(`select status from tt_asks where id=$1`, [ask7]))[0]!.status, "gone");

  // ── 허락 기다리던 폰: 자리가 끝나면 '거절'이 아니라 끝난 까닭을 본다
  await query(`update tt_seats set started_at = now() - interval '20 minutes' where store_id='joseon' and table_no=1 and status='on'`);
  const wj = await join(J(1), "team", null);
  assert.equal(wj.status, "wait");
  await endTeam(j1.dev);
  assert.deepEqual(await sync(wj.dev, -1, 0), { kind: "out", why: "team" });

  // ── 사장님이 끄면 들어와 있던 폰도 닫히고, 다시 켜면 이어진다
  await saveTTStore("joseon", { on: false });
  assert.deepEqual(await sync(lone.dev, -1, 0), { kind: "out", why: "off" });
  await rejects(send(j2.dev, jr.id, "꺼진 뒤", "nonce-off-0001"), "out");
  await saveTTStore("joseon", { on: true });
  assert.equal((await sync(lone.dev, -1, 0)).kind, "state", "다시 켜면 이어서");

  // ── 보관 정리: 이틀 지난 영업일 것만 지운다
  const p = await purgeTableTalk(new Date(Date.now() + 5 * 86400 * 1000));
  assert.ok(p.seats > 0);

  console.log("tabletalk smoke OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
