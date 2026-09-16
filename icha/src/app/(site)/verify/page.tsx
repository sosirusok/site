import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReceiptUploader } from "@/components/flow/ReceiptUploader";
import type { StoreLite } from "@/components/flow/types";
import { joinOr } from "@/components/site/StoreHelpers";
import { getMemberSession } from "@/lib/auth/session";
import { ruleLine } from "@/lib/copy";
import { getMember } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES, getStore, giftStoresFor } from "@/lib/stores";
import styles from "./verify.module.css";

export const metadata: Metadata = { title: "영수증 올리기" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/verify");
  const sp = await searchParams;
  const fromRaw = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const from = fromRaw ? getStore(fromRaw) : null;
  const [rules, member] = await Promise.all([getRules(), getMember(session.memberId)]);
  const stores: StoreLite[] = STORES.map((s) => ({ id: s.id, shortName: s.shortName, name: s.name, drink: s.drink }));

  return (
    <section className={`wrap ${styles.page}`} aria-labelledby="verify-title">
      <div className={styles.head}>
        <h1 id="verify-title" className="h1">영수증 올리기</h1>
        <p className="cap">{ruleLine(rules)}</p>
        {from && <p className="cap">{from.shortName} 영수증이면 {joinOr(giftStoresFor(from.id).map((s) => s.shortName))}에서 한 잔 받아요.</p>}
      </div>

      {rules.eventActive ? (
        <ReceiptUploader
          rules={{ receiptValidHours: rules.receiptValidHours, dailyLimitPerMember: rules.dailyLimitPerMember, minAmount: rules.minAmount, couponValidDays: rules.couponValidDays }}
          stores={stores}
          totalSpend={member?.totalSpend ?? 0}
        />
      ) : (
        <div className={`card-soft ${styles.paused}`}>
          <p className="h3">지금은 영수증을 받지 않아요</p>
          <p className="cap">{rules.notice || "다시 시작하면 홈에서 알려 드릴게요."}</p>
          <Link href="/wallet" className="btn btn-secondary btn-sm">쿠폰함 보기</Link>
        </div>
      )}
    </section>
  );
}
