import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseTableCode } from "@/lib/tabletalk/code";
import { clearDev, readDev, setDev } from "@/lib/tabletalk/cookie";
import {
  TTError, admit, answer, ask, cancelAsk, closeRoom, endTeam, join, leaveDevice, refuseAsk, send, sync, type JoinMode,
} from "@/lib/tabletalk/service";
import { getTTSettings } from "@/lib/tabletalk/settings";
import { cleanNonce } from "@/lib/tabletalk/text";
import type { Sync } from "@/lib/tabletalk/types";
import { countHit, currentPace, withPace } from "@/lib/tabletalk/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 테이블톡 API 하나.
 *  GET  ?v=변경번호&after=마지막글번호 — 몇 초마다 묻기(바뀐 게 없으면 { kind: "same" } 한 줄)
 *  POST { op, ... } — 입장·말 걸기·답하기·보내기·나가기 등. 처리한 뒤 새 상태를 같이 돌려줘 화면이 한 번 더 묻지 않게 한다.
 */

function out(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function int(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function failure(e: unknown): NextResponse {
  if (e instanceof TTError) return out({ ok: false, error: e.message, code: e.code }, e.status);
  console.error("[tt]", e);
  return out({ ok: false, error: "잠시 연결이 고르지 않습니다. 다시 눌러 주세요.", code: "server" }, 500);
}

export async function GET(req: Request) {
  try {
    await countHit();
    const url = new URL(req.url);
    // 나가진 폰이어도 쿠키는 그대로 둔다 — 같은 폰이 그사이 다시 들어와 새 쿠키를 받았으면, 늦게 도착한 이 응답이 그 새 쿠키를 지우게 된다
    const s = await sync(await readDev(), int(url.searchParams.get("v"), -1), int(url.searchParams.get("after"), 0));
    return out({ ok: true, sync: await withPace(s) });
  } catch (e) {
    return failure(e);
  }
}

/** 다른 사이트에서 손님 쿠키로 대신 누르게 하는 요청(CSRF)을 막는다 — 같은 주소에서 온 요청만 */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    await countHit();
    if (!sameOrigin(req)) return out({ ok: false, error: "잘못된 요청입니다.", code: "origin" }, 403);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const op = typeof body.op === "string" ? body.op : "";
    const after = int(body.after, 0);
    let dev = await readDev();

    if (op === "join") {
      // 가게 와이파이·통신사 공유 IP 로 손님 여럿이 같은 IP 일 수 있어 넉넉하게. 같은 테이블 되풀이는 아래에서 따로 막는다
      if (!(await rateLimit(`tt-join:${clientIp(req)}`, 120, 600))) throw new TTError("잠시 후 다시 시도해 주세요.", 429, "rate");
      if ((await currentPace()).closed) throw new TTError("오늘은 테이블톡 이용이 많아 새로 들어오기를 잠시 멈췄습니다.", 503, "closed");
      const settings = await getTTSettings();
      const ref = typeof body.code === "string" ? parseTableCode(body.code, (s) => settings[s].gen) : null;
      if (!ref) throw new TTError("QR 이 맞지 않습니다. 테이블에 붙은 QR 을 다시 찍어 주세요.", 400, "badqr");
      if (ref.via === "pick" && !settings[ref.store].pick) throw new TTError("이 가게는 테이블에 붙은 테이블톡 QR 을 찍어 들어갑니다.", 403, "qronly");
      const mode: JoinMode = body.mode === "team" || body.mode === "fresh" ? body.mode : "start";
      // 거절당하고 또 누르는 걸 끝없이 받지 않는다 — 같은 테이블로 10분에 6번
      if (mode !== "start" && !(await rateLimit(`tt-join-team:${clientIp(req)}:${ref.store}:${ref.table}`, 6, 600))) {
        throw new TTError("들어가기를 너무 많이 눌렀습니다. 잠시 뒤에 다시 해 주세요.", 429, "rate");
      }
      const r = await join(ref, mode, dev);
      await setDev(r.dev);
      dev = r.dev;
      return out({ ok: true, sync: await withPace(await sync(dev, -1, 0)) });
    }

    if (op === "leave-phone" || op === "end") {
      if (op === "end") await endTeam(dev);
      else await leaveDevice(dev);
      await clearDev();
      return out({ ok: true, sync: { kind: "out", why: op === "end" ? "team" : "self" } satisfies Sync });
    }

    // 여기부터는 들어와 있는 폰만. 예산을 거의 다 쓴 날은 새 글·새 신청을 받지 않는다(보던 대화는 계속 보인다)
    const pace = await currentPace();
    if (pace.closed && (op === "ask" || op === "send" || (op === "answer" && body.ok === true))) {
      throw new TTError("오늘은 테이블톡 이용이 많아 새 글을 잠시 멈췄습니다.", 503, "closed");
    }
    switch (op) {
      case "ask":
        await ask(dev, int(body.to, 0), body.note);
        break;
      case "answer":
        await answer(dev, body.ask, body.ok === true);
        break;
      case "cancel":
        await cancelAsk(dev, body.ask);
        break;
      case "refuse":
        await refuseAsk(dev, body.ask, body.how === "report" ? "report" : "block");
        break;
      case "send":
        await send(dev, body.room, body.body, cleanNonce(body.nonce));
        break;
      case "leave":
      case "block":
      case "report":
        await closeRoom(dev, body.room, op);
        break;
      case "admit":
        await admit(dev, body.dev, body.ok === true);
        break;
      default:
        throw new TTError("알 수 없는 요청입니다.", 400, "op");
    }
    return out({ ok: true, sync: await withPace(await sync(dev, -1, after)) });
  } catch (e) {
    return failure(e);
  }
}
