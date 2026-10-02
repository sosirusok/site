import { getMenuImage } from "@/lib/db/queries";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

/**
 * 관리자가 올린 메뉴 사진. `?v=<수정 시각>` 이 붙은 주소(menuImageUrl)는 브라우저·CDN 모두 오래 캐시하고(사진을 바꾸면 주소가 바뀐다),
 * 버전 없는 주소는 5분만 캐시해 사진을 바꿨을 때 하루씩 옛 사진이 보이지 않게 한다.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return fail("없음", 404);
  const img = await getMenuImage(n).catch(() => null);
  if (!img) return fail("없음", 404);
  const versioned = new URL(req.url).searchParams.has("v");
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      // s-maxage 가 있어야 Vercel CDN 도 들고 있다 — 없으면 폰마다 함수 호출 + DB 읽기
      "Cache-Control": versioned ? "public, max-age=31536000, s-maxage=31536000, immutable" : "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
