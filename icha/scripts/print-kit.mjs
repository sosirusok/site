// 인쇄 재료 굽기 — CSS 로 도형을 그리지 않고, 실제 알파 마스크 이미지를 만들어 깐다.
//
// 만드는 것
//  1) tear/*.png   찢긴 종이 가장자리 마스크. 사각형 패널의 직선 경계를 없앤다.
//  2) ink/*.png    잉크 롤러가 고르게 먹지 않은 자국. 단색 색면 위에 얹어 "칠"이 아니라 "인쇄"로 만든다.
//  3) stamp/*.png  네 변이 다 갉아먹힌 도장 마스크. mask-border 로 9분할해 버튼에 씌운다.
//  4) grain.webp   인화지 결. 화면 전체에 overlay 로 얹어 "깨끗한 디지털 면"을 없앤다.
//
// 왜 이미지인가: border-radius 를 0 으로 두든 clip-path 로 모서리를 깎든 그건 여전히 기하 도형이다.
// 종이가 찢어진 자리는 수식으로 안 나온다 — 난수에서 뽑은 윤곽을 굽어서 써야 한다.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images", "print");
fs.mkdirSync(path.join(OUT, "tear"), { recursive: true });
fs.mkdirSync(path.join(OUT, "ink"), { recursive: true });
fs.mkdirSync(path.join(OUT, "stamp"), { recursive: true });

/** 재현 가능한 난수 — 빌드마다 같은 그림이 나와야 캐시가 산다 */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * 주기 1차원 값 노이즈 — 끝과 처음이 이어진다.
 * mask-border 의 변 조각은 타일처럼 반복되므로, 이어 붙는 자리가 안 맞으면 톱니가 규칙적으로 보인다.
 */
function ridgeLoop(rand, n, octaves) {
  const out = new Float64Array(n).fill(0);
  let amp = 1, pts = 7;
  for (let o = 0; o < octaves; o++) {
    const key = Array.from({ length: pts }, () => rand() * 2 - 1);
    for (let i = 0; i < n; i++) {
      const x = (i / n) * pts, i0 = Math.floor(x), t = x - i0;
      const e = t * t * (3 - 2 * t);
      out[i] += (key[i0 % pts] * (1 - e) + key[(i0 + 1) % pts] * e) * amp;
    }
    amp *= 0.5; pts *= 2;
  }
  return out;
}

/** 1차원 값 노이즈: 굵은 요철 위에 잔 요철을 얹는다 */
function ridge(rand, n, octaves) {
  const out = new Float64Array(n).fill(0);
  let amp = 1, step = Math.max(2, Math.round(n / 7));
  for (let o = 0; o < octaves; o++) {
    const pts = Math.ceil(n / step) + 2;
    const key = Array.from({ length: pts }, () => rand() * 2 - 1);
    for (let i = 0; i < n; i++) {
      const x = i / step, i0 = Math.floor(x), t = x - i0;
      const e = t * t * (3 - 2 * t);
      out[i] += (key[i0] * (1 - e) + key[i0 + 1] * e) * amp;
    }
    amp *= 0.48; step = Math.max(2, Math.round(step / 2.4));
  }
  return out;
}

/**
 * 찢긴 가장자리 마스크 — 아래쪽이 찢겨 나간 흰 판.
 * 흰 = 종이가 남은 곳, 투명 = 찢겨 나간 곳. CSS mask-image 로 쓴다.
 */
async function tear(seed, file, { w = 1440, h = 44, deep = 0.72, fibres = true, up = false } = {}) {
  const rand = rng(seed);
  const prof = ridge(rand, w, 5);
  const px = Buffer.alloc(w * h * 2, 0); // 그레이+알파
  for (let x = 0; x < w; x++) {
    // 이 x 에서 종이가 어디까지 남았는지
    const cut = h * (1 - deep) + prof[x] * h * deep * 0.5 + h * deep * 0.5;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 2;
      const yy = up ? h - 1 - y : y;          // up 이면 위쪽이 찢긴 판
      let a = yy < cut ? 255 : 0;
      // 경계에 한 픽셀짜리 거친 섬유를 남긴다 — 자를 대고 자른 선처럼 보이지 않게
      if (fibres && a === 0 && yy - cut < 2.2 && rand() < 0.42) a = 255;
      if (fibres && a === 255 && cut - yy < 1.6 && rand() < 0.3) a = 0;
      px[i] = 255; px[i + 1] = a;
    }
  }
  await sharp(px, { raw: { width: w, height: h, channels: 2 } }).png({ compressionLevel: 9, palette: true }).toFile(path.join(OUT, "tear", file));
}

/**
 * 잉크 자국 — 롤러가 고르게 먹지 않아 생기는 얼룩. 검은 반투명 알파 타일.
 * 단색 색면 위에 multiply 로 얹으면 "칠한 면"이 "인쇄된 면"이 된다.
 */
async function ink(seed, file, { s = 256, strength = 0.3 } = {}) {
  const rand = rng(seed);
  // 롤러 자국(저주파, 세로로 길게 늘어난 얼룩) + 종이 결(고주파 소금후추)
  const lw = 12, lh = 40;                     // 세로로 길쭉하게 — 롤러가 지나간 방향
  const coarse = new Float64Array(lw * lh);
  for (let i = 0; i < coarse.length; i++) coarse[i] = rand();
  const px = Buffer.alloc(s * s * 2, 0);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const fx = (x / s) * lw, fy = (y / s) * lh;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0;
      const ex = tx * tx * (3 - 2 * tx), ey = ty * ty * (3 - 2 * ty);
      const g = (xx, yy) => coarse[(((yy % lh) + lh) % lh) * lw + (((xx % lw) + lw) % lw)];
      const roller =
        (g(x0, y0) * (1 - ex) + g(x0 + 1, y0) * ex) * (1 - ey) +
        (g(x0, y0 + 1) * (1 - ex) + g(x0 + 1, y0 + 1) * ex) * ey;
      // 종이 결 — 난수를 그대로 쓴다. 뭉개면 인쇄가 아니라 그라데이션이 된다
      const speck = rand() < 0.5 ? 0 : 1;
      const fine = rand();
      let a = (roller - 0.42) * 1.5;          // 롤러 얼룩
      a += (fine - 0.5) * 0.55;               // 결
      a += speck * (rand() < 0.06 ? 0.5 : 0); // 드문드문 찍힌 점
      a = Math.max(0, Math.min(1, a)) * strength;
      const i = (y * s + x) * 2;
      px[i] = 0; px[i + 1] = Math.round(a * 255);
    }
  }
  await sharp(px, { raw: { width: s, height: s, channels: 2 } }).webp({ quality: 74, alphaQuality: 88, effort: 6 }).toFile(path.join(OUT, "ink", file));
}

/**
 * 도장 마스크 — 네 변이 다 고르지 않은 판. mask-border(9분할)로 버튼에 씌운다.
 * 가운데는 늘어나거나 반복되므로 거의 꽉 찬 상태로 두고, 요철은 slice 안(가장자리 띠)에만 넣는다.
 */
async function stamp(seed, file, { w = 300, h = 80, slice = 14, amp = 4.2, ring = 0 } = {}) {
  const rand = rng(seed);
  const inW = w - slice * 2, inH = h - slice * 2;
  // 각 변의 침식 깊이. 변 조각이 반복되므로 주기 노이즈를 쓴다
  const mk = (n, a) => { const r = ridgeLoop(rand, n, 4); return Array.from(r, (v) => Math.max(0.4, Math.min(slice - 1.5, a * (0.6 + v * 0.7)))); };
  const top = mk(inW, amp), bot = mk(inW, amp * 1.08);
  const lft = mk(inH, amp * 0.85), rgt = mk(inH, amp * 0.85);
  // 모서리는 늘어나지 않고 한 번만 찍히므로 여기서만 사선으로 조금 더 닳게 한다
  const bite = Array.from({ length: 4 }, () => slice * (0.25 + rand() * 0.5));
  const at = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
  const px = Buffer.alloc(w * h * 2, 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = x < w / 2 ? x : w - 1 - x, cy = y < h / 2 ? y : h - 1 - y;
      const k = (x < w / 2 ? 0 : 1) + (y < h / 2 ? 0 : 2);
      // 잉크가 남은 쪽이 양수인 거리. 가장 가까운 변(과 모서리 사선)까지
      const d = Math.min(
        y - at(top, x - slice), (h - 1 - at(bot, x - slice)) - y,
        x - at(lft, y - slice), (w - 1 - at(rgt, y - slice)) - x,
        (cx + cy - bite[k]) * 0.72,
      );
      // ring 이면 테두리 띠만 남긴다 — 속이 빈 버튼의 선은 2px 라 통째로 마스크하면 선이 다 갉여 나간다
      let a = ring ? (d >= 0 && d <= ring ? 255 : 0) : (d >= 0 ? 255 : 0);
      // 경계에서만 잉크가 튀고 빠진다 — 면 전체에 점을 뿌리면 스프레이가 된다
      const dd = ring ? Math.min(d, ring - d) : d;
      if (a === 255 && dd < (ring ? 1.1 : 3) && rand() < (ring ? 0.2 : 0.34) * (1 - dd / (ring ? 1.1 : 3))) a = 0;
      if (a === 0 && d > -2.4 && d < ring + 2.4 && rand() < (ring ? 0.16 : 0.3) * (1 + Math.min(d, ring - d) / 2.4)) a = 255;
      px[(y * w + x) * 2] = 255; px[(y * w + x) * 2 + 1] = a;
    }
  }
  await sharp(px, { raw: { width: w, height: h, channels: 2 } }).png({ compressionLevel: 9, palette: true }).toFile(path.join(OUT, "stamp", file));
}

/**
 * 인화지 결 — 화면 전체에 overlay 로 얹는 회색 잡티 타일.
 * 128 이 중립이라 평균은 그대로 두고 밝기만 미세하게 흔든다. 깨끗한 단색 면이 안 남는다.
 */
async function grain(seed, file, { s = 220, sigma = 11, levels = 24 } = {}) {
  const rand = rng(seed);
  const px = Buffer.alloc(s * s, 128);
  // 굵은 얼룩(종이 뜬 자국) 위에 잔 입자
  const cw = 11, coarse = new Float64Array(cw * cw);
  for (let i = 0; i < coarse.length; i++) coarse[i] = rand() * 2 - 1;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const fx = (x / s) * cw, fy = (y / s) * cw;
      const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const ex = tx * tx * (3 - 2 * tx), ey = ty * ty * (3 - 2 * ty);
      const g = (a, b) => coarse[(((b % cw) + cw) % cw) * cw + (((a % cw) + cw) % cw)];
      const blob = (g(x0, y0) * (1 - ex) + g(x0 + 1, y0) * ex) * (1 - ey) + (g(x0, y0 + 1) * (1 - ex) + g(x0 + 1, y0 + 1) * ex) * ey;
      // 박스뮐러 대신 난수 세 개를 더해 정규분포 흉내 — 소금후추가 아니라 입자로 보이게
      const n = (rand() + rand() + rand() - 1.5) * 1.35;
      let v = 128 + n * sigma + blob * sigma * 0.5;
      v = Math.round(Math.max(0, Math.min(255, v)) / (256 / levels)) * (256 / levels);
      px[y * s + x] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  await sharp(px, { raw: { width: s, height: s, channels: 1 } }).webp({ lossless: true, effort: 6 }).toFile(path.join(OUT, file));
}

const jobs = [
  tear(1013, "tear-a.png"),
  tear(7717, "tear-b.png"),
  tear(4421, "tear-c.png", { deep: 0.6 }),
  tear(9083, "tear-d.png", { h: 28, deep: 0.8 }),
  tear(3359, "tear-e.png", { h: 60, deep: 0.55 }),
  tear(5501, "tear-up-a.png", { up: true }),
  tear(8123, "tear-up-b.png", { h: 34, deep: 0.62, up: true }),
  ink(2207, "ink-a.webp"),
  ink(6421, "ink-b.webp", { strength: 0.3 }),
  stamp(4657, "stamp-a.png"),
  stamp(2801, "stamp-b.png", { amp: 3.4 }),
  stamp(9137, "stamp-c.png", { w: 220, h: 64, slice: 11, amp: 2.8 }),
  stamp(6673, "stamp-d.png", { w: 360, h: 96, slice: 16, amp: 5.4 }),
  stamp(1187, "stamp-s.png", { w: 170, h: 40, slice: 7, amp: 2.1 }),
  stamp(3313, "ring-a.png", { w: 240, h: 72, slice: 12, amp: 2.6, ring: 3 }),
  stamp(7901, "ring-b.png", { w: 240, h: 72, slice: 12, amp: 2.2, ring: 2.6 }),
  grain(1721, "grain.webp"),
];
await Promise.all(jobs);
const list = ["tear", "ink", "stamp"].flatMap((d) => fs.readdirSync(path.join(OUT, d))).concat("grain.webp");
console.log("인쇄 재료 %d장:", list.length, list.join(" "));
