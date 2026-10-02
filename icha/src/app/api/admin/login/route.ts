import { verifyPassword } from "@/lib/auth/password";
import { setAdminSession } from "@/lib/auth/session";
import { audit, getAdmin } from "@/lib/db/queries";
import { errorResponse, fail, json } from "@/lib/http";
import { clientIp, rateHit, rateLimit, rateUnder } from "@/lib/rate-limit";

/** 없는 아이디에도 같은 시간만큼 계산한다 — 응답 시간으로 아이디가 있는지 알아내지 못하게 */
const DUMMY_HASH = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (!(await rateLimit(`admin-login:${ip}`, 10, 600))) return fail("잠시 후 다시 시도해 주세요.", 429);
    const body = (await req.json().catch(() => ({}))) as { id?: string; password?: string };
    const id = (body.id ?? "").trim().toLowerCase().slice(0, 40);
    if (!id || !body.password) return fail("아이디 또는 비밀번호가 맞지 않습니다.", 401);
    // 계정 단위 제한은 두 겹: 한 곳(IP)에서 한 계정은 15분에 8회, 모든 곳을 합쳐서는 "틀린 것만" 15분에 100회.
    // 맞힌 시도까지 한 통에 세면 남이 일부러 틀려 사장님 계정을 잠가 둘 수 있다. 100회는 10자 비밀번호를 맞히기엔 턱없이 적다
    const failKey = `admin-login-fail:${id}`;
    if (!(await rateLimit(`admin-login-id:${id}:${ip}`, 8, 900)) || !(await rateUnder(failKey, 100, 900))) {
      return fail("이 계정으로 로그인 시도가 너무 많습니다. 15분 뒤 다시 시도해 주세요.", 429);
    }
    const admin = await getAdmin(id);
    const ok = await verifyPassword(body.password, admin?.pwHash ?? DUMMY_HASH);
    if (!admin || !admin.active || !ok) {
      await rateHit(failKey, 900);
      return fail("아이디 또는 비밀번호가 맞지 않습니다.", 401);
    }
    await setAdminSession({ adminId: admin.id, name: admin.name, role: admin.role, storeId: admin.storeId });
    await audit(admin.id, "admin.login", null, { ip });
    return json({ ok: true, admin: { id: admin.id, name: admin.name, role: admin.role, storeId: admin.storeId } });
  } catch (e) {
    return errorResponse(e);
  }
}
