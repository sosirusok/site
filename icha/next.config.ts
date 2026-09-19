import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // 병렬 작업/테스트용: 프로세스마다 다른 출력 폴더를 쓸 수 있게
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp"],
  images: {
    // 모든 이미지는 리포지토리 안(public/)에 두고 외부 로더를 쓰지 않는다.
    formats: ["image/avif", "image/webp"],
    // 키트 장식 그림(스티커·제목판·메모·컷아웃)은 quality 70, 사진은 기본 75 — 목록 밖 값은 가까운 값으로 바뀐다(Next 16)
    qualities: [70, 75],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [
      {
        // 자체 호스팅 글꼴(scripts/fonts-local.mjs 가 복사) — 파일 이름이 곧 판이라 1년 캐시
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
