/**
 * 사장님이 보낸 일러스트 자산(PNG, 투명 배경)을 웹 크기로 줄여 public/art/ 에 넣는다.
 *   node scripts/import-art.mjs <원본 폴더>
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2];
const out = path.join(process.cwd(), "public", "art");
fs.mkdirSync(out, { recursive: true });

const S = ["joseon", "tokyo", "wareureu"];
const BTN = ["start", "shoot", "pick-photo", "menu", "choose", "get-coupon", "use"];
const STATE = ["default", "pressed", "loading", "disabled"];
const map = {};
for (const [i, s] of S.entries()) {
  map[`3. 매장별 구분 표시(${i + 1}).png`] = [`badge-${s}`, 720];
  map[`4. 매장 선택 카드(${i + 1}).png`] = [`card-${s}`, 600];
  map[`13. 다른 매장의 혜택 선택 화면(${i + 1}).png`] = [`pick-from-${s}`, 800];
  map[`15. 무료 증정 쿠폰 디자인(${i + 1}).png`] = [`coupon-${s}`, 900];
  map[`27. 매장 부착용 QR 포스터(${i + 1}).png`] = [`poster-art-${s}`, 1100];
  map[`28. 테이블이나 계산대용 소형 안내물(${i + 1}).png`] = [`tent-art-${s}`, 800];
}
for (let n = 1; n <= 28; n++) {
  const key = BTN[Math.floor((n - 1) / 4)];
  const st = STATE[(n - 1) % 4];
  map[`6. 주요 버튼 디자인 세트(${n}).png`] = [`btn-${key}-${st}`, 640];
}
["how-1", "how-2", "how-3"].forEach((n, i) => (map[`7. 이용 방법 안내 그래픽(${i + 1}).png`] = [n, 800]));
["status-checking", "status-ok", "status-photo-fail", "status-wrong-store", "status-used"].forEach((n, i) => (map[`11. 영수증 확인 상태 표시(${i + 1}).png`] = [n, 480]));
map["12. 인식된 영수증 정보 확인 화면.png"] = ["receipt-info", 800];
["wallet-active", "wallet-used", "wallet-expired"].forEach((n, i) => (map[`17. 쿠폰함 디자인(${i + 1}).png`] = [n, 600]));
map["18. 쿠폰 사용 버튼과 사용 확인창(1).png"] = ["btn-use-staff", 640];
map["18. 쿠폰 사용 버튼과 사용 확인창(2).png"] = ["confirm-card", 640];
["empty-pocket", "empty-holder", "retry"].forEach((n, i) => (map[`20. 쿠폰이 없거나 문제가 생겼을 때의 안내 화면(${i + 1}).png`] = [n, 560]));
map["23. 누적 결제금액과 VIP 달성 진행 표시.png"] = ["vip-progress", 900];
map["24. 매장별 적립 내역 디자인.png"] = ["ledger", 900];
for (let n = 1; n <= 12; n++) map[`26. VIP 달성 안내와 전환 효과(${n}).png`] = [`vipcard-${String(n).padStart(2, "0")}`, 800];
["icon-receipt", "icon-coupon", "icon-store", "icon-phone", "icon-vip", "icon-history", "icon-ok", "icon-error", "icon-back"].forEach((n, i) => (map[`31. 사이트 공통 아이콘 세트(${i + 1}).png`] = [n, 256]));
for (let n = 1; n <= 8; n++) map[`5. 상단 메뉴와 하단 이동 메뉴(${n}).png`] = [`nav-ref-${n}`, 1200];

const manifest = {};
let done = 0;
for (const f of fs.readdirSync(src)) {
  const m = map[f];
  if (!m) { console.log("skip", f); continue; }
  const [name, width] = m;
  const img = sharp(path.join(src, f)).trim({ threshold: 12 });
  const meta = await img.toBuffer({ resolveWithObject: true });
  const w = Math.min(width, meta.info.width);
  const outPath = path.join(out, `${name}.png`);
  await sharp(meta.data).resize({ width: w, withoutEnlargement: true }).png({ compressionLevel: 9, palette: false }).toFile(outPath);
  const om = await sharp(outPath).metadata();
  manifest[name] = { src: `/art/${name}.png`, width: om.width, height: om.height };
  done++;
}
fs.writeFileSync(path.join(process.cwd(), "src", "lib", "art-manifest.json"), JSON.stringify(manifest, null, 1));
console.log("done", done, "files;", Object.keys(manifest).length, "in manifest");
