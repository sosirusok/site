/**
 * 키트 가운데 CSS 배경으로 쓰는 그림(bg-night·bg-night-wide·tape·arrow)의 가벼운 WebP 판을 만든다 → public/images/bg/ + src/lib/kit-variants.json
 *   npm run kit  (prebuild 에도 묶여 있다)
 * 원본(public/images/kit/*.jpg|png)은 그대로 두고 화면은 image-set() 으로 WebP 를 먼저, 못 읽는 브라우저는 원본을 쓴다(src/lib/kit.ts kitCssVars, globals.css).
 *  - bg-night 1080x1920 → 780px(휴대폰, ≤480px 화면) · 1560px 을 달라고 하지만 원본이 1080 이라 1080px(그보다 넓은 화면), 품질 70
 *  - bg-night-wide 1920x1080 → 1280px · 1920px(가로 화면), 품질 70
 *  - tape 400x120 → 272px(68px 자리의 4배), arrow 600x300 → 176px(44px 자리의 4배): 알파 유지
 * 키트 폴더 밖(public/images/bg/)에 두므로 kit-manifest 는 이 파일들을 세지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const kit = path.join(root, "public", "images", "kit");
const out = path.join(root, "public", "images", "bg");
const json = path.join(root, "src", "lib", "kit-variants.json");

/** 이름: 만들 폭들. 폭이 하나면 파일 이름에 폭을 붙이지 않는다 */
const JOBS = [
  { name: "bg-night", widths: [780, 1560], quality: 70 },
  { name: "bg-night-wide", widths: [1280, 1920], quality: 70 },
  { name: "tape", widths: [272], quality: 82 },
  { name: "arrow", widths: [176], quality: 82 },
];

function source(name) {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const f = path.join(kit, `${name}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

fs.mkdirSync(out, { recursive: true });
const manifest = {};
for (const job of JOBS) {
  const src = source(job.name);
  if (!src) {
    console.log(`kit-variants: ${job.name} 없음 — 건너뜀`);
    continue;
  }
  const list = [];
  const meta = await sharp(src).metadata();
  for (const w of job.widths) {
    // 원본보다 키우지 않는다 — 파일 이름은 실제 폭(bg-night 1080 원본에 1560 을 달라고 하면 bg-night-1080.webp)
    const width = Math.min(w, meta.width ?? w);
    const file = job.widths.length > 1 ? `${job.name}-${width}.webp` : `${job.name}.webp`;
    const dst = path.join(out, file);
    if (list.some((x) => x.src.endsWith(`/${file}`))) continue;
    const info = await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: job.quality, effort: 5 }).toFile(dst);
    list.push({ w: info.width, src: `/images/bg/${file}` });
    console.log(`kit-variants: ${path.relative(root, src)} → ${path.relative(root, dst)} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
  }
  manifest[job.name] = list;
}
fs.writeFileSync(json, JSON.stringify(manifest, null, 1) + "\n");
console.log(`kit-variants: ${Object.keys(manifest).length}장 → src/lib/kit-variants.json`);
