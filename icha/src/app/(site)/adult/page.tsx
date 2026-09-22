import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNext } from "@/components/flow/format";
import { AdultGate } from "@/components/flow/AdultGate";
import { getMemberSession } from "@/lib/auth/session";
import { getMember } from "@/lib/db/queries";
import { adultBornOnOrBefore } from "@/lib/identity/adult";
import { identityEnabled, identityMock } from "@/lib/identity/portone";
import styles from "./adult.module.css";

export const metadata: Metadata = { title: "성인 확인", robots: { index: false, follow: false } };

/**
 * 이미 로그인한 손님의 성인 확인 — 본인확인을 붙이기 전에 받아 간 쿠키로 들어온 경우 여기로 온다.
 * 번호를 다시 받지 않는다. 지금 로그인된 그 번호 그대로, 성인 여부만 새긴다.
 */
export default async function AdultPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/wallet");
  const session = await getMemberSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!identityEnabled() && !identityMock()) redirect(next);
  const member = await getMember(session.memberId);
  if (member?.adultVerifiedAt) redirect(next);

  return (
    <div className={styles.page} data-footer="short">
      <h1 className="h1">성인 확인이 한 번 필요합니다</h1>
      <p className="lead">
        술을 걸고 하는 행사라 {adultBornOnOrBefore(new Date())}년생까지만 쿠폰을 쓸 수 있습니다.
        통신사 본인확인 한 번이면 끝이고, 다음부터는 묻지 않습니다.
      </p>
      <AdultGate next={next} />
      <p className="fineprint">
        확인 결과 중 성인 여부만 남깁니다. 이름·생년월일·주민등록번호는 저장하지 않고, 확인 자체는 통신사와 본인확인기관이 합니다.
      </p>
    </div>
  );
}
