import { getMemberSession } from "@/lib/auth/session";
import { reasonText } from "@/lib/config";
import { errorResponse, fail, json } from "@/lib/http";
import { submitReceipt } from "@/lib/receipt/service";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const session = await getMemberSession();
    if (!session) return fail("로그인이 필요합니다.", 401);
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return fail("영수증 사진을 올려 주세요.");
    if (file.size > MAX_BYTES) return fail("사진이 너무 큽니다 (15MB 이하).");
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await submitReceipt({ memberId: session.memberId, file: buf });
    const r = result.receipt;
    return json({
      ok: true,
      receipt: {
        id: r.id,
        status: r.status,
        storeId: r.storeId,
        amount: r.amount,
        receiptAt: r.receiptAt?.toISOString() ?? null,
        reasons: r.reasons.map((c) => ({ code: c, text: reasonText(c) })),
        createdAt: r.createdAt.toISOString(),
      },
      giftStoreIds: result.giftStoreIds,
      read: result.read,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
