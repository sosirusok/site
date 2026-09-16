/**
 * 조사 자료(네이버 플레이스·블로그에서 모은 사진)를 public/images/stores/<id>/ 로 복사·축소한다.
 *
 *   node scripts/import-store-images.mjs            # 복사 + 경로 검증
 *   node scripts/import-store-images.mjs --check    # 검증만 (stores.ts 가 가리키는 파일이 다 있는지)
 *
 * 이 스크립트로 메뉴 사진을 다시 복사했다면 이어서 `node scripts/knockout-menu-cutouts.mjs` 를 돌린다.
 * (흰 배경에 오려 놓은 사진은 투명 PNG 로 바꿔야 어두운 화면에서 흰 사각형으로 보이지 않는다.)
 *
 * 원본 위치는 NAVER_DIR 환경변수로 바꿀 수 있다. 기본값은 조사 스크래치 디렉터리.
 * 규칙: 긴 변 1600px 이하(작은 원본은 확대하지 않음), JPEG 82. 메뉴 썸네일은 640px, JPEG 80.
 *       매장당 총 용량 6MB 이하. 사람 얼굴이 크게 나온 사진·홍보용 합성 이미지는 목록에서 뺐다.
 *
 * 주의: 조사 매니페스트의 일부 파일명은 내용과 어긋난다(와르르맨숀 exterior-01 은 실내 로고 벽,
 *       interior-10 이 실제 외관). 아래 목록은 파일을 직접 보고 정한 것이다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.env.NAVER_DIR ?? "/tmp/claude-0/-home-user-site/81a66946-186e-5e97-8475-393564c666cb/scratchpad/naver";
const OUT = path.join(ROOT, "public", "images", "stores");
const STORES_TS = path.join(ROOT, "src", "lib", "stores.ts");

const GALLERY = { max: 1600, quality: 82 };
const THUMB = { max: 640, quality: 80 };
const STORE_BUDGET = 6 * 1024 * 1024;

/** [원본 파일, 저장 이름] — menu/ 로 시작하면 썸네일 규격 */
const PLAN = {
  joseon: [
    ["exterior-night-01.jpg", "hero.jpg"],
    ["exterior-day-01.jpg", "exterior-day.jpg"],
    ["exterior-night-02.jpg", "exterior-sign-night.jpg"],
    ["entrance-door-01.jpg", "entrance-door.jpg"],
    ["entrance-garden-01.jpg", "entrance-garden.jpg"],
    ["interior-01.jpg", "interior-hall.jpg"],
    ["interior-03.jpg", "interior-window.jpg"],
    ["interior-2f-room-01.jpg", "interior-2f-room.jpg"],
    ["food-kalguksu-01.jpg", "kalguksu.jpg"],
    ["food-haemul-pajeon-01.jpg", "haemul-pajeon.jpg"],
    ["food-modeum-jeon-01.jpg", "modeum-jeon.jpg"],
    ["food-haemul-maeun-kalguksu-01.jpg", "haemul-maeun-kalguksu.jpg"],
    ["food-kimchi-jeon-01.jpg", "kimchi-jeon.jpg"],
    ["drink-makgeolli-2tong1ban-01.jpg", "makgeolli-2tong1ban.jpg"],
    ["drink-honey-makgeolli-01.jpg", "honey-makgeolli.jpg"],
    ["drink-makgeolli-cheers-01.jpg", "makgeolli-cheers.jpg"],
    ["menu-board-anju-01.jpg", "menu-board-anju.jpg"],
    ["menu-board-drinks-01.jpg", "menu-board-drinks.jpg"],
    // 메뉴 썸네일 (업체 등록 메뉴 사진 + 블로그 사진)
    ["menu-food-bajirak-kalguksu.jpg", "menu/bajirak-kalguksu.jpg"],
    ["menu-food-spicy-seafood-kalguksu.jpg", "menu/haemul-maeun-kalguksu.jpg"],
    ["menu-food-mul-naengmyeon.jpg", "menu/mul-naengmyeon.jpg"],
    ["menu-food-mandu.jpg", "menu/mandu.jpg"],
    ["menu-food-haemul-pajeon.jpg", "menu/haemul-pajeon.jpg"],
    ["menu-food-banban-jeon.jpg", "menu/banban-jeon.jpg"],
    ["menu-food-hobak-jeon.jpg", "menu/hobak-jeon.jpg"],
    ["menu-food-bindaetteok.jpg", "menu/bindaetteok.jpg"],
    ["menu-food-dubu-kimchi.jpg", "menu/dubu-kimchi.jpg"],
    ["menu-food-sundae-bokkeum.jpg", "menu/sundae-bokkeum.jpg"],
    ["menu-food-duruchigi.jpg", "menu/duruchigi.jpg"],
    ["menu-food-golbaengi-somyeon.jpg", "menu/golbaengi-somyeon.jpg"],
    ["menu-food-dakttongjip.jpg", "menu/dakttongjip.jpg"],
    ["menu-food-odeng-tang.jpg", "menu/odeng-tang.jpg"],
    ["menu-food-sundubu-tang.jpg", "menu/sundubu-tang.jpg"],
    ["menu-food-bulgogi-jeongol.jpg", "menu/bulgogi-jeongol.jpg"],
    ["menu-food-kimchi-dubu-samgyeop.jpg", "menu/kimchi-dubu-samgyeop.jpg"],
    ["menu-drink-joseon-makgeolli.jpg", "menu/joseon-makgeolli.jpg"],
    ["menu-drink-cocktail-makgeolli.jpg", "menu/cocktail-makgeolli.jpg"],
    ["menu-drink-neurinmaeul-makgeolli.jpg", "menu/neurinmaeul-makgeolli.jpg"],
    ["food-kalguksu-01.jpg", "menu/kalguksu.jpg"],
    ["food-kimchi-jeon-01.jpg", "menu/kimchi-jeon.jpg"],
    ["food-modeum-jeon-01.jpg", "menu/modeum-jeon.jpg"],
    ["food-kimchi-muksabal-01.jpg", "menu/kimchi-muksabal.jpg"],
    ["drink-honey-makgeolli-01.jpg", "menu/honey-makgeolli.jpg"],
    ["drink-makgeolli-2tong1ban-01.jpg", "menu/makgeolli-2tong1ban.jpg"],
  ],
  tokyo: [
    ["exterior-01-storefront-night.jpg", "hero.jpg"],
    ["exterior-02-street-angle.jpg", "exterior-alley.jpg"],
    ["exterior-04-window-graphics.jpg", "exterior-window.jpg"],
    ["exterior-05-standing-light-sign.jpg", "exterior-light-sign.jpg"],
    ["interior-01-counter-kitchen.jpg", "interior-counter.jpg"],
    ["interior-02-noren-light-panel.jpg", "interior-noren.jpg"],
    ["interior-03-keg-fridge.jpg", "interior-keg-fridge.jpg"],
    ["drink-02-staff-pouring-tap.jpg", "draft-tap.jpg"],
    ["drink-01-pouring-creamy-foam.jpg", "draft-foam.jpg"],
    ["drink-03-tokyo-wheat-beer-orange.jpg", "wheat-beer.jpg"],
    ["food-01-beer-wheat-beer-cold-ham-plate.jpg", "cold-ham-plate-beers.jpg"],
    ["food-04-signature-cold-ham-plate-top.jpg", "cold-ham-plate-top.jpg"],
    ["food-06-egg-fried-rice.jpg", "egg-fried-rice.jpg"],
    ["food-03-beer-and-cheesecake.jpg", "beer-cheesecake.jpg"],
    ["menu-board-01-beers.jpg", "menu-board-beers.jpg"],
    ["menu-board-02-food.jpg", "menu-board-food.jpg"],
    // 메뉴 썸네일 (업체 등록 메뉴 사진; 코젤 브랜드 이미지는 실사가 아니라 제외)
    ["menu-00-santory-milko-draft.jpg", "menu/suntory-milko.jpg"],
    ["menu-01-santory-creamy-draft.jpg", "menu/suntory-creamy.jpg"],
    ["menu-02-santory-soft-draft.jpg", "menu/suntory-soft.jpg"],
    ["menu-03-signature-ham-set.jpg", "menu/signature-ham-set.jpg"],
    ["menu-04-signature-cold-ham-plate.jpg", "menu/signature-cold-ham-plate.jpg"],
    ["menu-07-cold-ham-bierschinken.jpg", "menu/cold-ham-plate.jpg"],
    ["menu-10-grill-wurst-sausage.jpg", "menu/grill-wurst.jpg"],
    ["menu-11-cold-ham-salad.jpg", "menu/cold-ham-salad.jpg"],
    ["menu-12-yuzu-tomato.jpg", "menu/yuzu-tomato.jpg"],
    ["menu-13-cucumber-salad.jpg", "menu/oi-salad.jpg"],
    ["menu-14-egg-fried-rice.jpg", "menu/egg-fried-rice.jpg"],
    ["menu-15-tebasaki-wing.jpg", "menu/tebasaki.jpg"],
    ["menu-16-truffle-fries.jpg", "menu/truffle-fries.jpg"],
    ["menu-17-tomato-egg-stirfry.jpg", "menu/tomato-egg.jpg"],
    ["menu-18-napolitan.jpg", "menu/napolitan.jpg"],
    ["menu-19-yakisoba.jpg", "menu/yakisoba.jpg"],
    ["menu-20-spicy-yakisoba.jpg", "menu/spicy-yakisoba.jpg"],
    ["menu-21-spicy-udon.jpg", "menu/spicy-udon.jpg"],
    ["menu-22-cinnamon-orange.jpg", "menu/cinnamon-orange.jpg"],
    ["menu-23-cheesecake.jpg", "menu/cheesecake.jpg"],
    ["menu-24-ice-cream.jpg", "menu/ice-cream.jpg"],
  ],
  wareureu: [
    ["exterior-01.jpg", "hero.jpg"], // 실제 내용: 로고 벽과 티파니 조명
    ["interior-10.jpg", "exterior-dusk.jpg"], // 실제 내용: 해질녘 외관·간판
    ["exterior-02.jpg", "exterior-sign-night.jpg"],
    ["interior-02.jpg", "interior-hall.jpg"],
    ["interior-08.jpg", "interior-overview.jpg"],
    ["interior-03.jpg", "interior-booth.jpg"],
    ["interior-09.jpg", "interior-stained-glass.jpg"],
    ["interior-screen-01.jpg", "interior-screen.jpg"],
    ["food-yukhoe-chadol-01.jpg", "yukhoe-chadol-ssam.jpg"],
    ["food-dakdoritang-cooked-01.jpg", "daechang-dakdoritang.jpg"],
    ["food-dakbal-soup-01.jpg", "gukmul-dakbal.jpg"],
    ["food-chadol-yukjeon.png", "chadol-yukjeon.jpg"],
    ["food-golbaengi.png", "muk-golbaengi.jpg"],
    ["food-bulsuji.jpg", "bulsuji.jpg"],
    ["food-potato-balls-01.jpg", "potato-balls.jpg"],
    ["menu-board-01.png", "menu-board.jpg"],
    ["menu-board-02.png", "menu-board-signature.jpg"],
    ["menu-kiosk-drinks-01.jpg", "kiosk-new-menu.jpg"], // 실제 내용: 통모짜튀김·쫀득감자 태블릿 화면
    // 메뉴 썸네일
    ["food-bulsuji.jpg", "menu/bulsuji.jpg"],
    ["food-chadol-yukjeon.png", "menu/chadol-yukjeon.jpg"],
    ["food-cream-jjamppong.png", "menu/cream-jjamppong.jpg"],
    ["food-croissant-pizza.jpg", "menu/croissant-pizza.jpg"],
    ["food-daechang-dakdoritang.jpg", "menu/daechang-dakdoritang.jpg"],
    ["food-golbaengi.png", "menu/muk-golbaengi.jpg"],
    ["food-kimchi-pizza-tangsuyuk.jpg", "menu/kimchi-pizza-tangsuyuk.jpg"],
    ["food-mara-suji.jpg", "menu/mara-suji-jeongol.jpg"],
    ["food-modum-suyuk.png", "menu/modum-suyuk.jpg"],
    ["food-suji-jeongol.jpg", "menu/suji-jeongol.jpg"],
    ["food-suyuk-kalbimmyeon.png", "menu/suyuk-kalbimmyeon.jpg"],
    ["food-yogurt.png", "menu/yogurt.jpg"],
    ["food-yukhoe-buldak.png", "menu/yukhoe-buldak.jpg"],
    ["food-yukhoe-chadol.jpg", "menu/yukhoe-chadol-ssam.jpg"],
    ["food-dakbal-soup-01.jpg", "menu/gukmul-dakbal.jpg"],
    ["food-dakbal-spicy-01.jpg", "menu/maekom-dakbal.jpg"],
  ],
};

async function convert(src, dest, { max, quality }) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const meta = await sharp(src).metadata();
  const w = meta.width ?? 0, h = meta.height ?? 0;
  await sharp(src)
    .rotate() // EXIF 회전 반영
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#fdfcf8" })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toFile(dest);
  const out = await sharp(dest).metadata();
  return { from: `${w}x${h}`, to: `${out.width}x${out.height}`, bytes: fs.statSync(dest).size };
}

async function importAll() {
  let failed = 0;
  for (const [store, list] of Object.entries(PLAN)) {
    let total = 0;
    const seen = new Set();
    for (const [srcName, destName] of list) {
      if (seen.has(destName)) throw new Error(`${store}: 저장 이름 중복 ${destName}`);
      seen.add(destName);
      const src = path.join(SRC, store, "images", srcName);
      const dest = path.join(OUT, store, destName);
      if (!fs.existsSync(src)) {
        console.error(`  없음: ${src}`);
        failed++;
        continue;
      }
      const spec = destName.startsWith("menu/") ? THUMB : GALLERY;
      const r = await convert(src, dest, spec);
      total += r.bytes;
      console.log(`  ${store}/${destName.padEnd(34)} ${r.from.padStart(9)} → ${r.to.padStart(9)}  ${(r.bytes / 1024).toFixed(0).padStart(4)}KB`);
    }
    // 목록에 없는 파일은 지운다 (이름을 바꿨을 때 찌꺼기가 남지 않도록)
    for (const f of walk(path.join(OUT, store))) {
      const rel = path.relative(path.join(OUT, store), f).split(path.sep).join("/");
      if (!seen.has(rel)) {
        fs.unlinkSync(f);
        console.log(`  삭제(목록에 없음): ${store}/${rel}`);
      }
    }
    const mb = total / 1024 / 1024;
    console.log(`${store}: ${list.length}장, ${mb.toFixed(2)}MB${total > STORE_BUDGET ? "  ← 6MB 초과!" : ""}`);
    if (total > STORE_BUDGET) failed++;
  }
  return failed === 0;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}

/** stores.ts 가 참조하는 모든 /images/stores/... 경로가 실제 파일인지, 반대로 안 쓰는 파일은 없는지 */
function check() {
  const ts = fs.readFileSync(STORES_TS, "utf8");
  // const J = "/images/stores/joseon"; 같은 접두어 상수와 `${J}/hero.jpg` 템플릿, 그리고 문자열 리터럴을 모두 모은다.
  const prefixes = Object.fromEntries([...ts.matchAll(/const (\w+) = "(\/images\/stores\/[^"]+)";/g)].map((m) => [m[1], m[2]]));
  const refs = new Set([
    ...[...ts.matchAll(/["'](\/images\/stores\/[^"']+)["']/g)].map((m) => m[1]),
    ...[...ts.matchAll(/`\$\{(\w+)\}(\/[^`]+)`/g)].map((m) => (prefixes[m[1]] ?? `<${m[1]}?>`) + m[2]),
  ]);
  let ok = true;
  for (const ref of refs) {
    const p = path.join(ROOT, "public", ref);
    if (!fs.existsSync(p)) {
      console.error(`파일 없음: ${ref}`);
      ok = false;
    }
  }
  const files = walk(OUT).map((f) => "/" + path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/"));
  const orphans = files.filter((f) => !refs.has(f));
  for (const o of orphans) console.warn(`stores.ts 에서 안 씀: ${o}`);
  console.log(`검증: 참조 ${refs.size}개 중 ${[...refs].filter((r) => fs.existsSync(path.join(ROOT, "public", r))).length}개 존재, 파일 ${files.length}개, 미사용 ${orphans.length}개`);
  return ok;
}

const checkOnly = process.argv.includes("--check");
const imported = checkOnly ? true : await importAll();
const verified = check();
if (!imported || !verified) process.exit(1);
