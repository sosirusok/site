/**
 * DB 초기화(스키마 생성 + 매장/메뉴 시드 + 초기 관리자). 앱이 첫 요청에서 자동으로 하지만,
 * 배포 직후 미리 돌려 두고 싶을 때:  DATABASE_URL=... npx tsx scripts/seed.ts
 */
import { getDb, one } from "../src/lib/db";
async function main() {
  await getDb();
  const stores = await one<{ n: number }>(`select count(*)::int as n from stores`);
  const menus = await one<{ n: number }>(`select count(*)::int as n from menu_items`);
  const admins = await one<{ n: number }>(`select count(*)::int as n from admins`);
  console.log(`매장 ${stores?.n}곳, 메뉴 ${menus?.n}개, 관리자 ${admins?.n}명 준비됨.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
