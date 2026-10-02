import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // 병렬 작업/테스트용: 프로세스마다 다른 출력 폴더를 쓸 수 있게
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp"],
  // 로컬용 PGlite(21MB)는 운영(DATABASE_URL 있음)에서 한 번도 안 쓴다 — Vercel 함수 묶음에 넣지 않아 처음 뜨는 시간을 줄인다
  outputFileTracingExcludes: process.env.VERCEL ? { "/*": ["node_modules/@electric-sql/pglite/**/*"] } : {},
  images: {
    // 모든 이미지는 리포지토리 안(public/)에 두고 외부 로더를 쓰지 않는다.
    formats: ["image/avif", "image/webp"],
    // 키트 장식 그림(스티커·제목판·메모·컷아웃)은 quality 70, 사진은 기본 75 — 목록 밖 값은 가까운 값으로 바뀐다(Next 16)
    qualities: [70, 75],
  },
  experimental: {
    // Vercel 함수는 요청 본문 4.5MB 까지만 받는다 — 더 크게 열어 둬도 거기서 끊긴다(메뉴 사진은 화면에서 줄여 보낸다)
    serverActions: { bodySizeLimit: "4.5mb" },
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
