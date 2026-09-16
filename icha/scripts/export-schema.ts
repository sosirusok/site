/** src/lib/db/schema.ts 의 SQL 을 supabase/schema.sql 로 내보낸다. `npx tsx scripts/export-schema.ts` */
import { writeFileSync } from "node:fs";
import { SCHEMA_SQL } from "../src/lib/db/schema";
const header = `-- 이차(二次) 스키마. 앱이 최초 기동 시 자동으로 같은 SQL 을 실행하므로 보통 손으로 돌릴 필요는 없다.
-- Supabase SQL Editor 에서 미리 만들고 싶을 때 이 파일을 실행한다. (생성: npx tsx scripts/export-schema.ts)
`;
writeFileSync("supabase/schema.sql", header + SCHEMA_SQL.trimStart());
console.log("supabase/schema.sql written");
