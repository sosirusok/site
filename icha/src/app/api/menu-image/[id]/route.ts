import { getMenuImage } from "@/lib/db/queries";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const img = await getMenuImage(Number(id)).catch(() => null);
  if (!img) return fail("없음", 404);
  return new Response(new Uint8Array(img.data), { headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=86400" } });
}
