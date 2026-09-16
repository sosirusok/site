/**
 * 흰 배경에 상품만 오려 놓은 메뉴 사진(도쿄스탠드 네이버 메뉴판 사진)을 투명 PNG 로 바꾼다.
 * 어두운 바탕(#0b0a12) 위에서 흰 사각형으로 보이던 썸네일이 상품만 떠 있는 모양이 된다.
 *
 *   node scripts/knockout-menu-cutouts.mjs [--dry]
 *
 * 하는 일: 테두리에서 시작해 흰색으로 이어진 영역만 투명하게(가장자리는 흰색 섞인 정도만큼 반투명, 흰 테두리 없게 원색 복원)
 * → 남은 내용의 사각형으로 자르고 정사각형으로 여백을 채운 뒤 320px PNG 로 저장. 원본 JPG 는 지운다.
 * 사진 전체가 실사(배경이 흰색이 아닌 것)면 건드리지 않는다.
 */
import { createRequire } from "node:module";
import { readdirSync, statSync, unlinkSync, existsSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = path.join(import.meta.dirname, "..", "public", "images", "stores");
const DRY = process.argv.includes("--dry");

/** 배경으로 볼 만큼 밝은가 (세 채널 모두) */
const BG_MIN = 230;
/** 완전한 흰색으로 보는 값 */
const BG_FULL = 250;

function listJpgs(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) out.push(...listJpgs(p));
    else if (/menu[/\\][^/\\]+\.jpe?g$/i.test(p)) out.push(p);
  }
  return out;
}

/** 테두리 픽셀이 거의 다 흰색이면 '오려낸 사진' */
function isCutout(data, w, h, ch) {
  let n = 0, white = 0;
  const min = (i) => Math.min(data[i], data[i + 1], data[i + 2]);
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { n++; if (min((y * w + x) * ch) >= BG_MIN) white++; }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { n++; if (min((y * w + x) * ch) >= BG_MIN) white++; }
  return white / n > 0.92;
}

async function knockout(file) {
  const src = sharp(file);
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  if (!isCutout(data, w, h, ch)) return null;

  // 테두리에서 시작하는 흰 영역만 채운다 (상품 안쪽의 흰 거품·접시는 남는다)
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (bg[p]) return;
    const i = p * ch;
    if (Math.min(data[i], data[i + 1], data[i + 2]) < BG_MIN) return;
    bg[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w, y = (p - x) / w;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const i = p * ch, o = p * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (!bg[p]) { rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = 255; continue; }
    const m = Math.min(r, g, b);
    // 흰색에 가까울수록 투명. 가장자리의 반투명 픽셀은 흰색을 걷어낸 원색으로 되돌린다.
    const a = Math.max(0, Math.min(255, Math.round(((BG_FULL - m) * 255) / (BG_FULL - BG_MIN))));
    if (a === 0) { rgba[o + 3] = 0; continue; }
    const un = (c) => Math.max(0, Math.min(255, Math.round((c * 255 - 255 * (255 - a)) / a)));
    rgba[o] = un(r); rgba[o + 1] = un(g); rgba[o + 2] = un(b); rgba[o + 3] = a;
  }

  const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const side = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 1.06);
  const out = file.replace(/\.jpe?g$/i, ".png");
  const buf = await sharp(trimmed.data)
    .resize(side, side, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(320, 320, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 88 })
    .toBuffer();
  if (!DRY) {
    await sharp(buf).toFile(out);
    if (existsSync(file) && out !== file) unlinkSync(file);
  }
  return { out: out.replace(path.join(import.meta.dirname, "..", "public"), ""), kb: Math.round(buf.length / 1024) };
}

const files = listJpgs(ROOT);
let n = 0;
for (const f of files) {
  const r = await knockout(f).catch((e) => { console.error(f, e.message); return null; });
  if (r) { n++; console.log(`${r.out}  ${r.kb}KB`); }
}
console.log(`${n}/${files.length} 장을 투명 PNG 로 바꿨습니다${DRY ? " (dry)" : ""}.`);
