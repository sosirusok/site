import { verifyPassword } from "@/lib/auth/password";
import { setAdminSession } from "@/lib/auth/session";
import { audit, getAdmin } from "@/lib/db/queries";
import { errorResponse, fail, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`admin-login:${clientIp(req)}`, 10, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);
    const body = (await req.json().catch(() => ({}))) as { id?: string; password?: string };
    const admin = body.id ? await getAdmin(body.id.trim()) : null;
    if (!admin || !admin.active || !body.password || !(await verifyPassword(body.password, admin.pwHash))) {
      return fail("아이디 또는 비밀번호가 맞지 않습니다.", 401);
    }
    await setAdminSession({ adminId: admin.id, name: admin.name, role: admin.role, storeId: admin.storeId });
    await audit(admin.id, "admin.login", null, { ip: clientIp(req) });
    return json({ ok: true, admin: { id: admin.id, name: admin.name, role: admin.role, storeId: admin.storeId } });
  } catch (e) {
    return errorResponse(e);
  }
}
