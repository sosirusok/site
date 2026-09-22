import { normalizePhone } from "@/lib/config";
import { countMembersByIdentity, findOrCreateMember, getMemberByPhone, markAdultVerified } from "@/lib/db/queries";
import { errorResponse, fail, json } from "@/lib/http";
import { clearAdultTicket, readAdultTicket } from "@/lib/identity/pending";
import { identityEnabled, identityMock } from "@/lib/identity/portone";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { setMemberSession } from "@/lib/auth/session";

/**
 * 전화번호만으로 로그인한다(인증번호 없음 — 사장님 결정). 번호가 곧 계정이다.
 * 남의 번호로 들어오는 것을 막지는 못하므로, 번호 단위 시도 횟수만 제한한다(한 번호 1시간 10회).
 *
 * 본인확인을 연결한 뒤에는 이 문이 열려 있으면 안 된다 — 화면에 버튼을 안 두더라도 이 주소로 바로 쏘면
 * 성인 확인을 건너뛸 수 있기 때문이다. 그래서 확인을 이미 받은 번호이거나, 방금 성인 확인을 마친 표가
 * 있을 때만 통과시킨다.
 */
export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`login:${clientIp(req)}`, 30, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);
    const body = (await req.json().catch(() => ({}))) as { phone?: string };
    const phone = normalizePhone(body.phone ?? "");
    if (!phone) return fail("휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)");
    if (!(await rateLimit(`login-phone:${phone}`, 10, 3600))) return fail("이 번호로 로그인 시도가 너무 많습니다. 1시간 뒤 다시 시도해 주세요.", 429);
    // 문을 막을 거면 회원 줄부터 만들지 않는다 — 거절할 번호로 빈 계정이 쌓이면 나중에 통계가 거짓말을 한다
    const gate = identityEnabled() || identityMock();
    const ticket = gate ? await readAdultTicket() : null;
    if (gate && !ticket) {
      const existing = await getMemberByPhone(phone);
      if (!existing?.adultVerifiedAt) return fail("먼저 휴대폰 본인확인을 해 주세요.", 403, { needIdentity: true });
    }

    // 다날 기본 계약은 통신사가 번호를 주지 않아, 성인 확인을 마친 손님이 번호를 직접 적는다. 그대로 두면
    // "내 이름으로 본인확인을 하고 남의 번호를 적는" 길이 남아, 이 기능을 붙인 이유(남의 쿠폰함)가 그대로다.
    // 한 사람(identityKey)은 한 번호에만 묶어 그 길을 막는다.
    // 계약에 전화번호 제공이 들어가면 인증 결과의 번호로 바로 로그인되어 이 경로 자체를 쓰지 않는다.
    if (ticket?.identityKey) {
      const mine = await getMemberByPhone(phone);
      if ((await countMembersByIdentity(ticket.identityKey, mine?.id ?? null)) > 0) {
        await clearAdultTicket();
        return fail("이미 다른 번호로 본인확인을 하셨습니다. 그 번호로 들어와 주세요.", 403);
      }
    }

    const member = await findOrCreateMember(phone);
    if (ticket) {
      await markAdultVerified(member.id, ticket.identityKey);
      await clearAdultTicket();
    }

    await setMemberSession({ memberId: member.id, phone: member.phone });
    return json({ ok: true, member: { id: member.id, phone: member.phone, tier: member.tier, totalSpend: member.totalSpend } });
  } catch (e) {
    return errorResponse(e);
  }
}
