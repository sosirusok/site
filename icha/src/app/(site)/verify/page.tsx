import type { Metadata } from "next";
import Link from "next/link";
import { joinOr } from "@/components/site/StoreHelpers";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND } from "@/lib/config";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import styles from "./verify.module.css";

export const metadata: Metadata = { title: "쿠폰 받는 법" };

/**
 * 쿠폰 받는 법 — 사진은 없다. 계산할 때 번호를 말하면 직원이 넣어 준다.
 * 포스터 QR(/verify?from=<매장>)로 들어오면 그 매장 기준으로 한 줄 더 보여 준다. 로그인 없이 볼 수 있다.
 */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [session, rules, sp] = await Promise.all([getMemberSession(), getRules(), searchParams]);
  const fromRaw = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const from = fromRaw ? getStore(fromRaw) : null;

  return (
    <section className={`wrap ${styles.page}`} aria-labelledby="verify-title">
      <div className={styles.head}>
        <h1 id="verify-title" className="h1-event">쿠폰 받는 법</h1>
        <p className="cap">{from ? `${from.shortName}에서 받으면 ${joinOr(giftStoresFor(from.id).map((s) => s.shortName))}에서 써요.` : BRAND.course}</p>
      </div>

      <ol className={styles.steps}>
        {STEP_LINES.map((line, i) => (
          <li key={line} className="row">
            <span className={`num ${styles.num}`} aria-hidden="true">{i + 1}</span>
            <div className="body">
              <p className="title"><span className="sr-only">{i + 1}. </span>{line}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="cap">{BRAND.condition} · {ruleLine(rules)}</p>

      {session ? (
        <Link href="/wallet" className="btn btn-block">내 쿠폰함</Link>
      ) : (
        <Link href="/login" className="btn btn-block">번호로 시작</Link>
      )}
    </section>
  );
}
