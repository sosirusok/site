import { getAdminSession, getMemberSession } from "@/lib/auth/session";
import { getReceipt, getReceiptImage } from "@/lib/db/queries";
import { fail } from "@/lib/http";
import { thumbnail } from "@/lib/receipt/image";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [member, admin] = await Promise.all([getMemberSession(), getAdminSession()]);
  const r = await getReceipt(id).catch(() => null);
  if (!r) return fail("없음", 404);
  if (!admin && (!member || member.memberId !== r.memberId)) return fail("권한 없음", 403);
  const img = await getReceiptImage(id);
  if (!img) return fail("이미지 없음", 404);
  const small = new URL(req.url).searchParams.get("w");
  const data = small ? await thumbnail(img.data, Math.min(1200, Math.max(120, Number(small) || 480))) : img.data;
  return new Response(new Uint8Array(data), { headers: { "Content-Type": img.mime, "Cache-Control": "private, max-age=3600" } });
}
