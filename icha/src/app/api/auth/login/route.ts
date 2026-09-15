import { normalizePhone } from "@/lib/config";
import { findOrCreateMember } from "@/lib/db/queries";
import { errorResponse, fail, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { setMemberSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`login:${clientIp(req)}`, 30, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);
    const body = (await req.json().catch(() => ({}))) as { phone?: string };
    const phone = normalizePhone(body.phone ?? "");
    if (!phone) return fail("휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)");
    const member = await findOrCreateMember(phone);
    await setMemberSession({ memberId: member.id, phone: member.phone });
    return json({ ok: true, member: { id: member.id, phone: member.phone, tier: member.tier, totalSpend: member.totalSpend } });
  } catch (e) {
    return errorResponse(e);
  }
}
