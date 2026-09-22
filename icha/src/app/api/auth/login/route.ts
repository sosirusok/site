import { normalizePhone } from "@/lib/config";
import { findOrCreateMember } from "@/lib/db/queries";
import { errorResponse, fail, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { setMemberSession } from "@/lib/auth/session";

/**
 * 전화번호만으로 로그인한다(인증번호 없음 — 사장님 결정). 번호가 곧 계정이다.
 * 남의 번호로 들어오는 것을 막지는 못하므로, 번호 단위 시도 횟수만 제한하고(한 번호 1시간 10회) 나머지는 README 의 운영 주의에 적었다.
 */
export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`login:${clientIp(req)}`, 30, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);
    const body = (await req.json().catch(() => ({}))) as { phone?: string };
    const phone = normalizePhone(body.phone ?? "");
    if (!phone) return fail("휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)");
    if (!(await rateLimit(`login-phone:${phone}`, 10, 3600))) return fail("이 번호로 로그인 시도가 너무 많습니다. 1시간 뒤 다시 시도해 주세요.", 429);
    const member = await findOrCreateMember(phone);
    await setMemberSession({ memberId: member.id, phone: member.phone });
    return json({ ok: true, member: { id: member.id, phone: member.phone, tier: member.tier, totalSpend: member.totalSpend } });
  } catch (e) {
    return errorResponse(e);
  }
}
