import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdultCheck } from "@/components/flow/AdultCheck";
import { koreanYear } from "@/lib/identity/adult";
import { identityEnabled, identityMock } from "@/lib/identity/portone";
import { verifierAppUrl } from "@/lib/identity/verifier-app";

export const metadata: Metadata = { title: "성인 확인", robots: { index: false, follow: false } };

/** "몇 년생까지"는 해마다 바뀐다 — 빌드할 때 굳히지 않고 요청 때마다 센다 */
export const dynamic = "force-dynamic";

/**
 * 성인 확인 — 신분증을 안 가져온 손님을 카운터에서 확인할 때 쓴다.
 * 로그인·쿠폰과 아무 상관이 없다. 이 화면은 혼자 돌아간다.
 */
export default async function AdultPage() {
  // 스토어 주소는 기기마다 다르다 — 화면이 붙기 전에 눌러도 맞는 곳으로 가게 요청 때 고른다
  const ua = (await headers()).get("user-agent") ?? "";
  return <AdultCheck year={koreanYear(new Date())} appUrl={verifierAppUrl(ua)} carrier={identityEnabled() || identityMock()} />;
}
