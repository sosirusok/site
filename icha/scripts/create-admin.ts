/**
 * 관리자/직원 계정 만들기.
 *   npx tsx scripts/create-admin.ts <아이디> <비밀번호> [이름] [매장id: joseon|tokyo|wareureu|없으면 총괄]
 * 운영 DB 에 넣으려면 DATABASE_URL 을 환경변수로 준다.
 */
import { getDb } from "../src/lib/db";
import { createAdmin, getAdmin, updateAdmin } from "../src/lib/db/queries";
import { hashPassword } from "../src/lib/auth/password";
import type { StoreId } from "../src/lib/config";

const [id, password, name, storeId] = process.argv.slice(2);
if (!id || !password) {
  console.error("사용법: npx tsx scripts/create-admin.ts <아이디> <비밀번호> [이름] [매장id]");
  process.exit(1);
}
async function main() {
  await getDb();
  const pwHash = await hashPassword(password!);
  const existing = await getAdmin(id!);
  if (existing) {
    await updateAdmin(id!, { pwHash, name: name ?? undefined, active: true });
    console.log(`기존 계정 '${id}' 비밀번호를 바꿨습니다.`);
  } else {
    const sid = (storeId as StoreId | undefined) ?? null;
    await createAdmin({ id: id!, name: name ?? id!, storeId: sid, role: sid ? "staff" : "owner", pwHash });
    console.log(`계정 '${id}' 를 만들었습니다. (${sid ? `${sid} 직원` : "총괄 관리자"})`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
