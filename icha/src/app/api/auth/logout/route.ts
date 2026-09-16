import { clearMemberSession } from "@/lib/auth/session";
import { json } from "@/lib/http";

export async function POST() {
  await clearMemberSession();
  return json({ ok: true });
}
