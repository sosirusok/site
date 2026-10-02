import { getAdminSession, getMemberSession } from "@/lib/auth/session";
import { getAdmin, getReceipt, getReceiptImage } from "@/lib/db/queries";
import { fail, isUuid } from "@/lib/http";
import { thumbnail } from "@/lib/receipt/image";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("없음", 404);
  const [member, admin] = await Promise.all([getMemberSession(), getAdminSession()]);
  const r = await getReceipt(id).catch(() => null);
  if (!r) return fail("없음", 404);
  const own = !!member && member.memberId === r.memberId;
  if (!own) {
    // 관리자는 DB 의 지금 계정으로 본다 — 정지된 계정·다른 매장 직원은 못 본다(매장 없는 영수증은 직원 누구나, 영수증 화면과 같은 규칙)
    if (!admin) return fail("권한 없음", 403);
    const row = await getAdmin(admin.adminId).catch(() => null);
    if (!row || !row.active) return fail("권한 없음", 403);
    if (row.role === "staff" && r.storeId && r.storeId !== row.storeId) return fail("권한 없음", 403);
  }
  const img = await getReceiptImage(id);
  if (!img) return fail("보관 기간이 지나 사진이 삭제되었습니다.", 404);
  const small = new URL(req.url).searchParams.get("w");
  const data = small ? await thumbnail(img.data, Math.min(1200, Math.max(120, Number(small) || 480))) : img.data;
  return new Response(new Uint8Array(data), { headers: { "Content-Type": img.mime, "Cache-Control": "private, max-age=3600" } });
}
