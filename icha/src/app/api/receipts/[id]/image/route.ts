import { checkAdmin } from "@/lib/auth/admin";
import { getMemberSession } from "@/lib/auth/session";
import { getReceipt, getReceiptImage } from "@/lib/db/queries";
import { fail, isUuid } from "@/lib/http";
import { thumbnail } from "@/lib/receipt/image";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return fail("없음", 404);
  const member = await getMemberSession();
  const r = await getReceipt(id).catch(() => null);
  if (!r) return fail("없음", 404);
  const own = !!member && member.memberId === r.memberId;
  if (!own) {
    // 관리자 화면과 같은 확인 — 정지된 계정, 비밀번호가 바뀐 뒤의 옛 로그인, 다른 매장 직원은 못 본다(매장 없는 영수증은 직원 누구나)
    const c = await checkAdmin();
    if (!c.ok) return fail("권한 없음", 403);
    if (c.s.role === "staff" && r.storeId && r.storeId !== c.s.storeId) return fail("권한 없음", 403);
  }
  const img = await getReceiptImage(id);
  if (!img) return fail("보관 기간이 지나 사진이 삭제되었습니다.", 404);
  const small = new URL(req.url).searchParams.get("w");
  const data = small ? await thumbnail(img.data, Math.min(1200, Math.max(120, Number(small) || 480))) : img.data;
  return new Response(new Uint8Array(data), { headers: { "Content-Type": img.mime, "Cache-Control": "private, max-age=3600" } });
}
