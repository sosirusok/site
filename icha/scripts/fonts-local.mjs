/**
 * 자체 호스팅 글꼴 파일을 public/fonts/ 로 — v15c "클럽 플라이어"의 두 디스플레이 서체를 @fontsource 패키지에서 복사한다.
 *   node scripts/fonts-local.mjs   (prebuild 에 묶여 있다)
 *   · Black Han Sans — 한글 포스터체. 히어로·섹션 제목·매장 이름·차수 숫자. korean(190KB) + latin(9KB)
 *   · Anton          — 라틴 초굵은 콘덴스드. 영문 라벨·숫자·마키. latin(18KB)
 * public/ 에 두는 이유: 첫 화면에 바로 쓰이는 글꼴이라 layout.tsx 가 <link rel="preload"> 로 미리 받게 하는데,
 * @fontsource 의 CSS 를 그대로 import 하면 빌드마다 해시가 붙은 주소가 되어 preload 주소를 적을 수 없다. src/app/fonts.css 의 @font-face 가 이 주소를 가리킨다.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const to = path.join(root, "public", "fonts");
/** [패키지, 파일명] — 파일명이 곧 public/fonts 안의 이름 */
const FILES = [
  ["black-han-sans", "black-han-sans-korean-400-normal.woff2"],
  ["black-han-sans", "black-han-sans-latin-400-normal.woff2"],
  ["anton", "anton-latin-400-normal.woff2"],
];

fs.mkdirSync(to, { recursive: true });
for (const [pkg, f] of FILES) {
  const src = path.join(root, "node_modules", "@fontsource", pkg, "files", f);
  const dst = path.join(to, f);
  if (!fs.existsSync(src)) {
    // 파일은 public/fonts/ 에 커밋되어 있다 — 패키지가 없는 환경(운영 설치)에서는 건너뛴다
    if (fs.existsSync(dst)) { console.log(`[fonts-local] ${f} — 패키지 없음, 이미 있는 파일을 그대로 씁니다`); continue; }
    console.error(`[fonts-local] ${src} 도 public/fonts/${f} 도 없습니다 (npm install 을 먼저).`);
    process.exit(1);
  }
  const data = fs.readFileSync(src);
  if (fs.existsSync(dst) && fs.readFileSync(dst).equals(data)) continue;
  fs.writeFileSync(dst, data);
  console.log(`[fonts-local] ${f} → public/fonts/ (${Math.round(data.length / 1024)}KB)`);
}
console.log(`[fonts-local] ${FILES.length}개 확인`);
