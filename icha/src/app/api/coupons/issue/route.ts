import { getMemberSession } from "@/lib/auth/session";
import { issueSideCoupon } from "@/lib/coupons";
import { errorResponse, fail, json } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const session = await getMemberSession();
    if (!session) return fail("로그인이 필요합니다.", 401);
    const body = (await req.json().catch(() => ({}))) as { receiptId?: string; menuItemId?: number };
    if (!body.receiptId || !Number.isInteger(body.menuItemId)) return fail("잘못된 요청입니다.");
    const c = await issueSideCoupon({ memberId: session.memberId, receiptId: body.receiptId, menuItemId: body.menuItemId as number });
    return json({ ok: true, coupon: { id: c.id, code: c.code, useStoreId: c.useStoreId, menuName: c.menuName, expiresAt: c.expiresAt.toISOString() } });
  } catch (e) {
    return errorResponse(e);
  }
}
