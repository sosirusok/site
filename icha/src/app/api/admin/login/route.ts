import { verifyPassword } from "@/lib/auth/password";
import { setAdminSession } from "@/lib/auth/session";
import { audit, getAdmin } from "@/lib/db/queries";
import { errorResponse, fail, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`admin-login:${clientIp(req)}`, 10, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);
    const body = (await req.json().catch(() => ({}))) as { id?: string; password?: string };
    const id = (body.id ?? "").trim().toLowerCase().slice(0, 40);
    if (!id || !body.password) return fail("아이디 또는 비밀번호가 맞지 않습니다.", 401);
    // 계정 단위 제한: 여러 IP 에서 한 계정을 두드리는 경우 (15분에 8회)
    if (!(await rateLimit(`admin-login-id:${id}`, 8, 900))) return fail("이 계정으로 로그인 시도가 너무 많습니다. 15분 뒤 다시 시도해 주세요.", 429);
    const admin = await getAdmin(id);
    if (!admin || !admin.active || !(await verifyPassword(body.password, admin.pwHash))) {
      return fail("아이디 또는 비밀번호가 맞지 않습니다.", 401);
    }
    await setAdminSession({ adminId: admin.id, name: admin.name, role: admin.role, storeId: admin.storeId });
    await audit(admin.id, "admin.login", null, { ip: clientIp(req) });
    return json({ ok: true, admin: { id: admin.id, name: admin.name, role: admin.role, storeId: admin.storeId } });
  } catch (e) {
    return errorResponse(e);
  }
}
