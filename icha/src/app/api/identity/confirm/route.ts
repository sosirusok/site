import { errorResponse, fail, json } from "@/lib/http";
import { isAdultKr } from "@/lib/identity/adult";
import { clearPending, readPending } from "@/lib/identity/pending";
import { identityConfig, identityMock, lookupVerification, type VerifiedCustomer } from "@/lib/identity/portone";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** 내 컴퓨터에서 흐름만 볼 때 쓰는 가짜 결과 — 운영에서는 여기까지 오지 않는다 */
function mockCustomer(): VerifiedCustomer {
  return { name: "테스트", birthDate: "1995-03-11", gender: "MALE", operator: "SKT" };
}

/**
 * 성인 확인 결과를 받아 판정만 돌려준다.
 *
 * 계정도 세션도 쿠폰도 건드리지 않는다. 신분증을 안 가져온 손님을 카운터에서 확인해 주는 도구라
 * 이 사이트의 로그인과는 아무 상관이 없다.
 *
 * 브라우저가 보낸 결과는 믿지 않는다 — 이 브라우저가 시작한 건인지(서명 쿠키) 보고,
 * 포트원에 직접 다시 물어 status 가 VERIFIED 인지 확인한 다음 생년월일로 판정한다.
 * 받은 이름·생년월일·성별·통신사·CI·DI 는 판정에만 쓰고 저장하지 않는다.
 */
export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`iv-confirm:${clientIp(req)}`, 30, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);

    const body = (await req.json().catch(() => ({}))) as { identityVerificationId?: string };
    const given = typeof body.identityVerificationId === "string" ? body.identityVerificationId : "";
    const pending = await readPending();
    if (!pending || !given || pending.ivId !== given) {
      await clearPending();
      return fail("확인 정보가 만료되었습니다. 다시 해 주세요.", 400);
    }

    const cfg = identityConfig();
    if (!cfg && !identityMock()) return fail("성인 확인이 아직 연결되지 않았습니다.", 503);

    let customer: VerifiedCustomer;
    if (cfg) {
      const found = await lookupVerification(cfg, pending.ivId);
      if (!found.ok) {
        await clearPending();
        const msg =
          found.reason === "ready" ? "인증창에서 끝까지 진행해 주세요."
          : found.reason === "failed" ? "확인에 실패했습니다. 다시 해 주세요."
          : found.reason === "not-found" ? "확인 기록을 찾을 수 없습니다. 다시 해 주세요."
          : "확인 서버와 연결하지 못했습니다. 잠시 후 다시 해 주세요.";
        return fail(msg, found.reason === "upstream" || found.reason === "bad-response" ? 502 : 400);
      }
      customer = found.customer;
    } else {
      customer = mockCustomer();
    }

    await clearPending();
    return json({ ok: true, adult: isAdultKr(customer.birthDate, new Date()), verifiedAt: new Date().toISOString() });
  } catch (e) {
    return errorResponse(e);
  }
}
