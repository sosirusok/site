import type { Metadata } from "next";
import { IdentityReturn } from "@/components/flow/IdentityReturn";

export const metadata: Metadata = { title: "본인확인 확인 중", robots: { index: false, follow: false } };

/**
 * 본인확인창에서 돌아오는 자리(redirectUrl).
 *
 * 모바일에서는 인증창이 팝업이 아니라 화면을 통째로 가져간다. 끝나면 여기로 되돌아오면서
 * 주소 뒤에 ?identityVerificationId=... 가 붙는다. 그 값을 서버에 넘겨 확정받고 원래 가려던 곳으로 보낸다.
 */
export default function LoginDonePage() {
  return <IdentityReturn />;
}
