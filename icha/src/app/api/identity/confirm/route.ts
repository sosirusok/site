import { createHash } from "node:crypto";
import { setMemberSession } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/config";
import { findOrCreateMember, getMember, markAdultVerified } from "@/lib/db/queries";
import { errorResponse, fail, json } from "@/lib/http";
import { adultBornOnOrBefore, isAdultKr } from "@/lib/identity/adult";
import { clearPending, readPending, setAdultTicket } from "@/lib/identity/pending";
import { identityConfig, identityMock, lookupVerification, type VerifiedCustomer } from "@/lib/identity/portone";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * DI 를 그대로 두지 않는다. DI 는 우리 사이트 안에서만 사람을 구분하는 값이지만 그래도 개인정보라,
 * 서버 비밀키를 섞어 한 번 더 해시해 둔다. 같은 사람인지 비교하는 일은 그대로 되고, DB 만 새어도 쓸모가 없다.
 */
function identityKeyOf(di: string | undefined): string | null {
  if (!di) return null;
  return createHash("sha256").update(`${di}:${process.env.SESSION_SECRET ?? "dev"}`).digest("hex");
}

/** 내 컴퓨터에서 흐름만 볼 때 쓰는 가짜 결과 — 운영에서는 여기까지 오지 않는다 */
function mockCustomer(): VerifiedCustomer {
  return { name: "테스트", birthDate: "1995-03-11", phoneNumber: "01012345678", gender: "MALE", operator: "SKT", di: "mock-di-1995" };
}

/**
 * 본인확인 마무리 — 브라우저가 보낸 결과는 믿지 않는다.
 *
 * 1) 이 브라우저가 시작한 건인지(서명 쿠키) 확인하고
 * 2) 포트원에 직접 물어 status 가 VERIFIED 인지 확인하고
 * 3) 생년월일로 성인 여부를 판정한 뒤
 * 4) 통신사가 확인해 준 번호로 회원을 잡고 세션을 준다.
 *
 * 저장하는 것은 "성인 확인 시각"과 "되돌릴 수 없는 식별값" 둘뿐이다.
 * 이름·생년월일·성별·통신사·CI 는 판정에만 쓰고 버린다.
 */
export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`iv-confirm:${clientIp(req)}`, 30, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);

    const body = (await req.json().catch(() => ({}))) as { identityVerificationId?: string };
    const given = typeof body.identityVerificationId === "string" ? body.identityVerificationId : "";
    const pending = await readPending();
    if (!pending || !given || pending.ivId !== given) {
      await clearPending();
      return fail("본인확인 정보가 만료되었습니다. 처음부터 다시 해 주세요.", 400);
    }

    const cfg = identityConfig();
    const mock = identityMock();
    if (!cfg && !mock) return fail("본인확인이 아직 연결되지 않았습니다.", 503);

    let customer: VerifiedCustomer;
    if (cfg) {
      const found = await lookupVerification(cfg, pending.ivId);
      if (!found.ok) {
        await clearPending();
        const msg =
          found.reason === "ready" ? "인증이 끝나지 않았습니다. 인증창에서 끝까지 진행해 주세요."
          : found.reason === "failed" ? "본인확인에 실패했습니다. 다시 시도해 주세요."
          : found.reason === "not-found" ? "본인확인 기록을 찾을 수 없습니다. 다시 시도해 주세요."
          : "본인확인 서버와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        return fail(msg, found.reason === "upstream" || found.reason === "bad-response" ? 502 : 400);
      }
      customer = found.customer;
    } else {
      customer = mockCustomer();
    }

    if (!isAdultKr(customer.birthDate, new Date())) {
      await clearPending();
      return fail(`${adultBornOnOrBefore(new Date())}년생까지만 이용하실 수 있습니다. 주류를 다루는 행사라 미성년자는 참여할 수 없습니다.`, 403, { underage: true });
    }

    const identityKey = identityKeyOf(customer.di);
    const verifiedPhone = normalizePhone(customer.phoneNumber ?? "");

    // ① 이미 로그인한 회원이 성인 확인만 받으러 온 경우
    if (pending.memberId) {
      const member = await getMember(pending.memberId);
      if (member) {
        await markAdultVerified(member.id, identityKey);
        await clearPending();
        return json({ ok: true, next: pending.next, member: { phone: member.phone } });
      }
    }

    // ② 통신사가 번호까지 확인해 준 경우 — 번호를 직접 입력받을 필요가 없다
    if (verifiedPhone) {
      const member = await findOrCreateMember(verifiedPhone);
      await markAdultVerified(member.id, identityKey);
      await setMemberSession({ memberId: member.id, phone: member.phone });
      await clearPending();
      return json({ ok: true, next: pending.next, member: { phone: member.phone } });
    }

    // ③ 성인임은 확인됐지만 번호를 안 주는 계약(다날 기본) — 번호는 따로 받는다
    await setAdultTicket({ identityKey });
    await clearPending();
    return json({ ok: true, needPhone: true, next: pending.next });
  } catch (e) {
    return errorResponse(e);
  }
}
