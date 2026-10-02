/**
 * 지금 관리자 — 쿠키(토큰)에 DB 의 지금 계정을 겹쳐 본다. 권한(총괄/직원·매장)은 토큰이 아니라 DB 값을 쓴다.
 * 정지된 계정, 비밀번호가 바뀐 뒤의 옛 로그인(최대 14일 남는 쿠키)은 로그인하지 않은 것으로 본다.
 */
import { getAdmin, type Admin } from "@/lib/db/queries";
import { getAdminSession, type AdminSession } from "./session";

export type AdminCheck = { ok: true; s: AdminSession; row: Admin } | { ok: false; why: "none" | "inactive" | "pw" };

export async function checkAdmin(): Promise<AdminCheck> {
  const s = await getAdminSession();
  if (!s) return { ok: false, why: "none" };
  const row = await getAdmin(s.adminId).catch(() => null);
  if (!row || !row.active) return { ok: false, why: "inactive" };
  // 초 단위로 비교 — 비밀번호를 바꾼 바로 그 초에 새로 로그인한 쿠키는 살린다
  if (row.pwChangedAt && (s.iat ?? 0) < Math.floor(row.pwChangedAt.getTime() / 1000)) return { ok: false, why: "pw" };
  return { ok: true, s: { adminId: row.id, name: row.name, role: row.role, storeId: row.storeId }, row };
}
