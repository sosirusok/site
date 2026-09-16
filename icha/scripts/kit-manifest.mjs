/**
 * 포스터 키트(public/images/kit/) 목록을 만든다 → src/lib/kit-manifest.json
 *   npm run kit
 * 파일 이름(확장자 뺀 것)이 그대로 키가 된다. { "plate-tokyo": { src, w, h } }
 * 이미지를 넣거나 바꾼 뒤 이 명령만 다시 돌리면 코드 수정 없이 화면이 바뀐다(src/lib/kit.ts 가 이 JSON 을 읽는다).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const dir = path.join(root, "public", "images", "kit");
const out = path.join(root, "src", "lib", "kit-manifest.json");

/** 예정된 55장 — 이름: [가로, 세로]. 크기가 다르면 경고만 하고 그대로 쓴다(코드는 실제 크기를 읽는다). */
const EXPECTED = {
  "bg-night": [1080, 1920], "bg-night-wide": [1920, 1080],
  title: [1400, 480], "head-banner": [1080, 420], "footer-line": [1400, 100],
  "plate-tokyo": [1200, 500], "plate-joseon": [1200, 500], "plate-wareureu": [1200, 500],
  "benefit-tokyo": [1000, 300], "benefit-joseon": [1000, 300], "benefit-wareureu": [1000, 300],
  "ribbon-event": [1600, 260], "step-1": [600, 360], "step-2": [600, 360], "step-3": [600, 360], "step-4": [600, 360], "pill-condition": [1200, 140],
  "label-benefit": [700, 200], "label-menu": [700, 200], "label-map": [700, 200], "label-review": [700, 200], "label-howto": [700, 200], "label-faq": [700, 200], "label-wallet": [700, 200], "label-guide": [700, 200],
  "btn-book": [900, 220], "btn-wallet": [900, 220], "btn-use": [900, 220], "btn-pick": [900, 220], "btn-get": [900, 220], "btn-search": [900, 220], "btn-review": [900, 220],
  "btn-login": [420, 150], "btn-close": [420, 150], "btn-directions": [420, 150],
  "icon-home": [240, 240], "icon-wallet": [240, 240], "icon-place": [240, 240], "icon-info": [240, 240],
  "note-good": [520, 600], "note-again": [700, 360], "note-today": [800, 360], "note-phone": [900, 420], arrow: [600, 300], tape: [400, 120], "stamp-free": [500, 500], "stamp-used": [500, 500],
  "cut-beer": [700, 1000], "cut-makgeolli": [900, 800], "cut-soju": [700, 1000], "cut-yogurt": [700, 800],
  ticket: [1400, 600], "empty-wallet": [700, 700], notfound: [700, 700], share: [1200, 630],
  /* 먼저 받은 것(55장 목록 밖) */
  "ticket-tokyo": [880, 290], "ticket-joseon": [880, 290], "ticket-wareureu": [880, 290], "sign-wareureu": [440, 100], icon: [512, 512],
};
/** 55장 목록에 드는 이름만 센다 */
const KIT55 = Object.keys(EXPECTED).filter((n) => !/^(ticket-|sign-|icon$)/.test(n));

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp|avif|gif)$/i.test(f)).sort() : [];
const manifest = {};
for (const f of files) {
  const name = f.replace(/\.[^.]+$/, "");
  const { width, height } = await sharp(path.join(dir, f)).metadata();
  if (!width || !height) {
    console.warn(`건너뜀(크기를 못 읽음): ${f}`);
    continue;
  }
  if (manifest[name]) console.warn(`같은 이름이 둘: ${manifest[name].src} 와 ${f} — 뒤의 것을 쓴다`);
  manifest[name] = { src: `/images/kit/${f}`, w: width, h: height };
  const exp = EXPECTED[name];
  if (exp && (exp[0] !== width || exp[1] !== height)) console.warn(`크기 다름: ${f} ${width}x${height} (예정 ${exp[0]}x${exp[1]}) — 그대로 쓴다`);
}
fs.writeFileSync(out, JSON.stringify(manifest, null, 1) + "\n");

const known = KIT55;
const arrived = known.filter((n) => manifest[n]);
const extra = Object.keys(manifest).filter((n) => !EXPECTED[n]);
console.log(`kit-manifest: ${Object.keys(manifest).length}장 → src/lib/kit-manifest.json`);
console.log(`예정 55장 중 도착 ${arrived.length}장${arrived.length < known.length ? ` (아직 없음: ${known.filter((n) => !manifest[n]).length}장)` : ""}`);
if (extra.length) console.log(`목록 밖 파일: ${extra.join(", ")}`);
