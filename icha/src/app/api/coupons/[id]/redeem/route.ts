import { getMemberSession } from "@/lib/auth/session";
import { redeemCoupon } from "@/lib/coupons";
import { errorResponse, fail, isUuid, json } from "@/lib/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getMemberSession();
    if (!session) return fail("로그인이 필요합니다.", 401);
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("쿠폰을 찾을 수 없습니다.", 404);
    const c = await redeemCoupon({ couponId: id, by: { memberId: session.memberId } });
    return json({ ok: true, coupon: { id: c.id, status: c.status, usedAt: c.usedAt?.toISOString() ?? null } });
  } catch (e) {
    return errorResponse(e);
  }
}
