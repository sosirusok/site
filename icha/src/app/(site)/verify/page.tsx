import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { STORES, getStore, giftStoresFor } from "@/lib/stores";
import { DrinkIcon } from "@/components/ui/icons";
import { ReceiptUploader } from "@/components/flow/ReceiptUploader";
import type { StoreLite } from "@/components/flow/types";
import styles from "./verify.module.css";

export const metadata: Metadata = { title: "영수증 인증" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await getMemberSession();
  if (!session) redirect("/login?next=/verify");
  const sp = await searchParams;
  const fromRaw = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const from = fromRaw ? getStore(fromRaw) : null;
  const rules = await getRules();
  const stores: StoreLite[] = STORES.map((s) => ({ id: s.id, shortName: s.shortName, name: s.name, drink: s.drink }));

  return (
    <section className={`wrap ${styles.page}`}>
      <div className={styles.grid}>
        <div className={styles.intro}>
          <p className="eyebrow">영수증 인증</p>
          <h1 className={`h1 ${styles.title}`}>
            계산하셨죠?<br />영수증 한 장이면 돼요.
          </h1>
          <p className={`lead ${styles.lead}`}>
            세 곳 중 한 곳에서 결제한 영수증을 찍어 올리면 바로 읽어 드려요. 승인되면 나머지 두 곳의 사이드 한 접시를 고를 수 있어요.
          </p>

          {from && (
            <p className={styles.from} data-store={from.id}>
              <DrinkIcon drink={from.drink} size={20} />
              <span>
                <b>{from.shortName}</b> 영수증이라면 {giftStoresFor(from.id).map((s) => s.shortName).join("과 ")}에서 한 접시예요.
              </span>
            </p>
          )}

          <dl className={styles.terms}>
            <div className={styles.term}>
              <dt className={`mono ${styles.termNum}`}>{rules.receiptValidHours}<span>시간</span></dt>
              <dd>결제 시각부터 {rules.receiptValidHours}시간 안에 올린 영수증만 받아요.</dd>
            </div>
            <div className={styles.term}>
              <dt className={`mono ${styles.termNum}`}>{rules.dailyLimitPerMember}<span>장</span></dt>
              <dd>하루에 {rules.dailyLimitPerMember}장까지 인증할 수 있어요.</dd>
            </div>
            {rules.minAmount > 0 && (
              <div className={styles.term}>
                <dt className={`mono ${styles.termNum}`}>{formatWon(rules.minAmount)}</dt>
                <dd>{formatWon(rules.minAmount)} 이상 결제한 영수증이어야 해요.</dd>
              </div>
            )}
            <div className={styles.term}>
              <dt className={`serif ${styles.termWord}`}>옆집</dt>
              <dd>영수증을 받은 매장에서는 혜택이 없어요. 쿠폰은 나머지 두 곳에서 써요.</dd>
            </div>
          </dl>
          <p className={`small ${styles.more}`}>
            인정되지 않는 경우와 개인정보 처리는 <Link href="/guide" className={styles.link}>이용 방법</Link>에 적어 두었어요.
          </p>
        </div>

        <div className={styles.uploader}>
          {rules.eventActive ? (
            <ReceiptUploader
              rules={{ receiptValidHours: rules.receiptValidHours, dailyLimitPerMember: rules.dailyLimitPerMember, minAmount: rules.minAmount, couponValidDays: rules.couponValidDays }}
              stores={stores}
            />
          ) : (
            <div className={`paper ${styles.paused}`}>
              <p className={`serif ${styles.pausedTitle}`}>지금은 영수증을 받지 않아요.</p>
              <p>{rules.notice || "이벤트가 잠시 쉬는 중이에요. 다시 시작하면 홈에 알려 드릴게요."}</p>
              <Link href="/wallet" className="btn btn-ghost">쿠폰함 보기</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
