import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Art } from "@/components/art/Art";
import { ReceiptUploader } from "@/components/flow/ReceiptUploader";
import { joinNames } from "@/components/flow/format";
import type { StoreLite } from "@/components/flow/types";
import { getMemberSession } from "@/lib/auth/session";
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
      <header className={styles.head}>
        <h1 id="verify-title" className="h1">영수증을 올려 주세요</h1>
        <p className={styles.lead}>
          {from
            ? `${from.shortName} 영수증이면 ${joinNames(giftStoresFor(from.id).map((s) => s.shortName))} 중 한 곳에서 한 잔을 드려요.`
            : "세 집 중 한 곳에서 계산한 영수증을 찍어 올리면, 나머지 두 집 중 한 곳의 술 한 잔이 쿠폰함에 들어가요."}
        </p>
      </header>

      {rules.eventActive ? (
        <ReceiptUploader
          rules={{ receiptValidHours: rules.receiptValidHours, dailyLimitPerMember: rules.dailyLimitPerMember, minAmount: rules.minAmount, couponValidDays: rules.couponValidDays }}
          stores={stores}
          totalSpend={member?.totalSpend ?? 0}
        />
      ) : (
        <div className={`panel ${styles.paused}`}>
          <div className={styles.pausedArt} aria-hidden="true"><Art name="empty-holder" sizes="30vw" /></div>
          <div className={styles.pausedText}>
            <p className="h3">지금은 영수증을 받지 않아요</p>
            <p>{rules.notice || "이벤트를 잠시 쉬고 있어요. 다시 시작하면 홈에서 알려 드릴게요."}</p>
            <Link href="/wallet" className="btn btn-outline">쿠폰함 보기</Link>
          </div>
        </div>
      )}
    </section>
  );
}
