import { redirect } from "next/navigation";
import { getMember } from "@/lib/db/queries";
import { identityEnabled, identityMock } from "./portone";

/**
 * 성인 확인 문지기.
 *
 * 본인확인을 연결한 뒤에도, 연결 전에 받아 간 쿠키로 들어오는 손님이 남아 있다. 쿠폰함·쿠폰 상세·사용 매장 고르기는
 * 결국 공짜 술을 손에 쥐여 주는 화면이라 여기서 한 번 더 막는다. 연결 전(키 없음)이면 아무 일도 하지 않는다.
 */
export async function requireAdult(memberId: string, next: string): Promise<void> {
  if (!identityEnabled() && !identityMock()) return;
  const member = await getMember(memberId);
  if (member && !member.adultVerifiedAt) redirect(`/adult?next=${encodeURIComponent(next)}`);
}
