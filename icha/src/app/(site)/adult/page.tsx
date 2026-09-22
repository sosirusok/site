import type { Metadata } from "next";
import { AdultCheck } from "@/components/flow/AdultCheck";

export const metadata: Metadata = { title: "성인 확인", robots: { index: false, follow: false } };

/**
 * 성인 확인 — 신분증을 안 가져온 손님을 카운터에서 확인할 때 쓴다.
 * 로그인·쿠폰과 아무 상관이 없다. 이 화면은 혼자 돌아간다.
 */
export default function AdultPage() {
  return <AdultCheck />;
}
