// 앱 아이콘 — public/images/kit/icon.png(512, 불투명)를 src/app/icon.png 으로 복사하고, 애플 홈 화면용 180px 을 sharp 로 만든다.
// 55장 키트가 도착해 icon.png 가 바뀌면 다시 실행한다:  node scripts/kit-icons.mjs   (npm run kit 에 묶여 있으면 그걸로)
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "public/images/kit/icon.png");
const outIcon = resolve(root, "src/app/icon.png");
const outApple = resolve(root, "src/app/apple-icon.png");

if (!existsSync(src)) {
  console.error(`[kit-icons] ${src} 이 없어 아이콘을 건너뜁니다.`);
  process.exit(0);
}
mkdirSync(dirname(outIcon), { recursive: true });

const meta = await sharp(src).metadata();
if (meta.width !== 512 || meta.height !== 512) {
  console.warn(`[kit-icons] icon.png 은 512x512 여야 합니다 (지금 ${meta.width}x${meta.height}). 512 로 맞춰 저장합니다.`);
  await sharp(src).resize(512, 512, { fit: "cover" }).png({ palette: true }).toFile(outIcon);
} else {
  copyFileSync(src, outIcon);
}
// 애플 아이콘은 iOS 가 모서리를 깎으므로 불투명 그대로 180px
await sharp(src).resize(180, 180, { fit: "cover", kernel: "lanczos3" }).flatten({ background: "#141221" }).png({ palette: true, compressionLevel: 9 }).toFile(outApple);
console.log(`[kit-icons] icon.png 512 → ${outIcon}\n[kit-icons] apple-icon.png 180 → ${outApple}`);
