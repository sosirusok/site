/**
 * 자체 호스팅 글꼴 파일을 public/fonts/ 로 — Do Hyeon(제목·간판·버튼, 한글 한 파일 + 라틴 한 파일)을 @fontsource 패키지에서 복사한다.
 *   node scripts/fonts-local.mjs   (prebuild 에 묶여 있다)
 * public/ 에 두는 이유: 첫 화면(검은 띠·콜아웃)에 바로 쓰이는 글꼴이라 layout.tsx 가 <link rel="preload"> 로 미리 받게 하는데,
 * @fontsource 의 CSS 를 그대로 import 하면 빌드마다 해시가 붙은 주소가 되어 preload 주소를 적을 수 없다. src/app/fonts.css 의 @font-face 가 이 주소를 가리킨다.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const from = path.join(root, "node_modules", "@fontsource", "do-hyeon", "files");
const to = path.join(root, "public", "fonts");
const FILES = ["do-hyeon-korean-400-normal.woff2", "do-hyeon-latin-400-normal.woff2"];

fs.mkdirSync(to, { recursive: true });
for (const f of FILES) {
  const src = path.join(from, f);
  const dst = path.join(to, f);
  if (!fs.existsSync(src)) {
    console.error(`[fonts-local] ${src} 이 없습니다 (npm install 을 먼저).`);
    process.exit(1);
  }
  const data = fs.readFileSync(src);
  if (fs.existsSync(dst) && fs.readFileSync(dst).equals(data)) continue;
  fs.writeFileSync(dst, data);
  console.log(`[fonts-local] ${f} → public/fonts/ (${Math.round(data.length / 1024)}KB)`);
}
console.log(`[fonts-local] ${FILES.length}개 확인`);
