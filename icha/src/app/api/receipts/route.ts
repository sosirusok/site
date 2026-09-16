import { getMemberSession } from "@/lib/auth/session";
import { reasonText } from "@/lib/config";
import { errorResponse, fail, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { submitReceipt } from "@/lib/receipt/service";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const session = await getMemberSession();
    if (!session) return fail("로그인이 필요합니다.", 401);
    // 회원 단위 제한은 submitReceipt 안에 있다. 여기서는 번호를 바꿔 가며 올리는 경우를 IP 로 묶는다.
    if (!(await rateLimit(`upload-ip:${clientIp(req)}`, 30, 600))) return fail("잠시 후 다시 시도해 주세요. (이 네트워크에서 요청이 너무 잦습니다)", 429);
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return fail("영수증 사진을 올려 주세요.");
    if (file.size > MAX_BYTES) return fail("사진 용량이 너무 큽니다. 6MB 이하 사진을 올려 주십시오.");
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
