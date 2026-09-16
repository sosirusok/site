import { createHash } from "node:crypto";
import sharp from "sharp";

export type NormalizedImage = {
  buffer: Buffer;
  mime: "image/jpeg";
  width: number;
  height: number;
  sha256: string;
  dhash: string;
};

/**
 * 업로드 이미지를 표준화한다: EXIF 회전 반영, 긴 변 1600px, JPEG 85.
 * 같은 원본을 다시 올리면 같은 결과(=같은 sha256)가 나온다.
 */
export async function normalizeImage(input: Buffer): Promise<NormalizedImage> {
  const { data, info } = await sharp(input, { failOn: "none", limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const sha256 = createHash("sha256").update(data).digest("hex");
  const dhash = await computeDHash(data);
  return { buffer: data, mime: "image/jpeg", width: info.width, height: info.height, sha256, dhash };
}

/** 9x8 그레이스케일 차분 해시(64bit, hex 16자) */
export async function computeDHash(buf: Buffer): Promise<string> {
  const { data } = await sharp(buf).grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let bits = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const l = data[y * 9 + x] ?? 0;
      const r = data[y * 9 + x + 1] ?? 0;
      bits = (bits << 1n) | (l < r ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, "0");
}

export function hammingDistance(a: string, b: string): number {
  if (!/^[0-9a-f]{16}$/.test(a) || !/^[0-9a-f]{16}$/.test(b)) return 64;
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

/** 관리자 화면용 썸네일 */
export async function thumbnail(buf: Buffer, width = 480): Promise<Buffer> {
  return sharp(buf).resize({ width, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
}
