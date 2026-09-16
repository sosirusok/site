import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND, formatWon } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { STORES, getStore, giftStoresFor } from "@/lib/stores";
import { ReceiptUploader } from "@/components/flow/ReceiptUploader";
import { joinNames } from "@/components/flow/format";
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
      <div className={styles.col}>
        <header className={styles.head}>
          <h1 className="h2">영수증 인증</h1>
          <p className={styles.lead}>
            {from
              ? `${from.shortName} 영수증을 인증하면 ${joinNames(giftStoresFor(from.id).map((s) => s.shortName))}에서 사이드 메뉴 1개를 무료로 드립니다.`
              : BRAND.tagline}
          </p>
        </header>

        {rules.eventActive ? (
          <ReceiptUploader
            rules={{ receiptValidHours: rules.receiptValidHours, dailyLimitPerMember: rules.dailyLimitPerMember, minAmount: rules.minAmount, couponValidDays: rules.couponValidDays }}
            stores={stores}
          />
        ) : (
          <div className={styles.paused}>
            <p className={styles.pausedTitle}>지금은 영수증을 받지 않습니다.</p>
            <p className={styles.pausedText}>{rules.notice || "이벤트가 잠시 중단되었습니다. 다시 시작하면 홈 화면에 안내합니다."}</p>
            <Link href="/wallet" className="btn btn-outline">쿠폰함 보기</Link>
          </div>
        )}

        <div className={styles.terms}>
          <h2 className={styles.termsTitle}>인정 기준</h2>
          <table className={`table ${styles.termsTable}`}>
            <tbody>
              <tr>
                <th scope="row">인정 기간</th>
                <td>결제 후 {rules.receiptValidHours}시간 이내</td>
              </tr>
              {rules.minAmount > 0 && (
                <tr>
                  <th scope="row">최소 금액</th>
                  <td>{formatWon(rules.minAmount)} 이상 결제</td>
                </tr>
              )}
              <tr>
                <th scope="row">하루 한도</th>
                <td>1인 {rules.dailyLimitPerMember}장</td>
              </tr>
              <tr>
                <th scope="row">사용 매장</th>
                <td>영수증을 받은 매장을 제외한 나머지 두 매장</td>
              </tr>
              <tr>
                <th scope="row">쿠폰 유효기간</th>
                <td>발급일부터 {rules.couponValidDays}일</td>
              </tr>
            </tbody>
          </table>
          <p className="small">
            인정되지 않는 경우와 개인정보 처리 방침은 <Link href="/guide" className={styles.link}>이용 안내</Link>에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
