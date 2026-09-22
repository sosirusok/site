import type { Metadata } from "next";
import { IdentityReturn } from "@/components/flow/IdentityReturn";

export const metadata: Metadata = { title: "성인 확인", robots: { index: false, follow: false } };

/** 통신사 인증창에서 돌아오는 자리 */
export default function AdultDonePage() {
  return <IdentityReturn />;
}
