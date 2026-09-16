/**
 * 관리자 페이지용 세션 확인. (Server Component 전용)
 */
import { redirect } from "next/navigation";
import { getAdminSession, type AdminSession } from "@/lib/auth/session";
import { getAdmin } from "@/lib/db/queries";

export async function requireAdminPage(): Promise<AdminSession> {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  const row = await getAdmin(s.adminId).catch(() => null);
  if (!row || !row.active) redirect("/admin/login?reason=inactive");
  return s;
}

export function isOwner(s: AdminSession): boolean {
  return s.role === "owner";
}

/** 총괄 관리자만 볼 수 있는 화면인지 판단. 아니면 null 대신 안내 컴포넌트를 그리도록 호출부에서 처리 */
export function canManage(s: AdminSession): boolean {
  return s.role === "owner";
}

/** 직원은 회원 번호를 마스킹해서 본다 */
export function phoneFor(s: AdminSession, phone: string, mask: (p: string) => string, full: (p: string) => string): string {
  return s.role === "owner" ? full(phone) : mask(phone);
}
