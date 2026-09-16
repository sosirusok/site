import type { Metadata } from "next";
import Link from "next/link";
import { joinOr } from "@/components/site/StoreHelpers";
import { StepsStrip } from "@/components/site/StepsStrip";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND } from "@/lib/config";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import styles from "./verify.module.css";

export const metadata: Metadata = { title: "쿠폰 받는 법" };

/**
 * 쿠폰 받는 법 — 포스터 순서 조각과 종이에 적은 순서 넷, 노란 스티커 하나.
 * 포스터 QR(/verify?from=<매장>)로 들어오면 그 매장 기준으로 한 줄 더 보여 준다. 로그인 없이 볼 수 있다.
 */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [session, rules, sp] = await Promise.all([getMemberSession(), getRules(), searchParams]);
  const fromRaw = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const from = fromRaw ? getStore(fromRaw) : null;

  return (
    <section className={styles.page} aria-labelledby="verify-title">
      <div className={styles.head}>
        <h1 id="verify-title" className={`plate plate-red ${styles.h1}`}>쿠폰 받는 법</h1>
        <p className={`hand hand-w ${styles.sub}`}>{from ? `${from.shortName}에서 받으면 ${joinOr(giftStoresFor(from.id).map((s) => s.shortName))}에서 써요.` : BRAND.course}</p>
      </div>

      <StepsStrip />

      <div className={`paper paper-r ${styles.paper}`}>
        <ol className={styles.steps}>
          {STEP_LINES.map((line, i) => (
            <li key={line} className={styles.step}>
              <span className={`plate plate-yellow plate-sm ${styles.num}`} aria-hidden="true">{i + 1}</span>
              <p className={styles.stepT}><span className="sr-only">{i + 1}. </span>{line}</p>
            </li>
          ))}
        </ol>
        <p className={styles.rule}>{BRAND.condition} · {ruleLine(rules)}</p>
      </div>

      {session ? (
        <Link href="/wallet" className="btn btn-block">내 쿠폰함</Link>
      ) : (
        <Link href="/login" className="btn btn-block">번호로 시작</Link>
      )}
    </section>
  );
}
