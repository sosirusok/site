import { safeNext } from "@/components/flow/format";
import { getMemberSession } from "@/lib/auth/session";
import { errorResponse, fail, json } from "@/lib/http";
import { identityConfig, identityMock, newVerificationId } from "@/lib/identity/portone";
import { setPending } from "@/lib/identity/pending";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * 본인확인 시작 — 브라우저가 인증창을 열 때 필요한 값을 내려 준다.
 *
 * storeId 와 channelKey 는 원래 브라우저에 노출되는 값이라 숨길 이유가 없지만, 빌드에 박지 않고
 * 여기서 내려 준다. 그래야 키를 바꿨을 때 정적 페이지를 다시 굽지 않아도 된다.
 * API_SECRET 은 절대 내려 보내지 않는다 — 결과 조회는 서버에서만 한다.
 */
export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`iv-start:${clientIp(req)}`, 20, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);

    const cfg = identityConfig();
    const mock = identityMock();
    if (!cfg && !mock) return json({ ok: false, configured: false, error: "본인확인이 아직 연결되지 않았습니다." }, 503);

    const body = (await req.json().catch(() => ({}))) as { next?: string };
    const next = safeNext(body.next, "/wallet");
    const session = await getMemberSession();
    const ivId = newVerificationId();
    await setPending({ ivId, next, memberId: session?.memberId });

    // 인증창은 대부분 모바일에서 리다이렉트로 돌아온다. 지금 보고 있는 주소로 돌려보내야
    // 방금 심은 진행 쿠키가 같이 돌아온다 — 다른 도메인으로 보내면 쿠키를 못 받아 인증이 버려진다.
    const redirectUrl = `${new URL(req.url).origin}/login/done`;

    if (!cfg) {
      // 내 컴퓨터에서만 — 실제 창 없이 흐름만 확인한다
      return json({ ok: true, mock: true, identityVerificationId: ivId, redirectUrl, next });
    }

    return json({
      ok: true,
      mock: false,
      storeId: cfg.storeId,
      channelKey: cfg.channelKey,
      identityVerificationId: ivId,
      redirectUrl,
      next,
      // PG 마다 넘길 수 있는 값이 다르다. 다날은 인증창에서 나이로 먼저 걸러 준다.
      //
      // AGELIMIT 은 "만" 나이인데 주류의 성인 기준은 연 나이다(청소년보호법 제2조 제1호). 19 로 적으면
      // 2007년 12월생처럼 올해 이미 성인이 된 손님이 아직 만 18세라는 이유로 막힌다 — 그것도 다날 화면에서
      // 막혀 우리 안내조차 못 보여 준다. 연 19세인 사람의 만 나이는 최소 18 이므로 여기서는 18 로
      // 성인일 수 없는 사람만 걷어내고, 진짜 판정은 서버가 생년월일로 한다(lib/identity/adult.ts).
      bypass:
        cfg.pg === "danal"
          ? { danal: { CPTITLE: cfg.serviceName, AGELIMIT: 18 } }
          : undefined,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
