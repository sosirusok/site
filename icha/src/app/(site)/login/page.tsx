import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { STORES } from "@/lib/stores";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { safeNext } from "@/components/flow/format";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "전화번호 로그인" };

const STEPS = [
  "참여 매장에서 결제한 영수증을 사진으로 인증합니다.",
  "나머지 두 매장 중 한 곳의 사이드 메뉴를 선택합니다.",
  "매장에서 직원 확인 후 쿠폰을 사용 처리합니다.",
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/verify");
  const session = await getMemberSession();
  if (session) redirect(sp.next ? next : "/wallet");

  return (
    <section className={`wrap ${styles.page}`}>
      <div className={styles.col}>
        <header className={styles.head}>
          <h1 className="h2">전화번호 로그인</h1>
          <p className={styles.lead}>휴대폰 번호만 입력하면 됩니다. 별도 가입이나 인증번호 절차는 없습니다.</p>
        </header>

        <PhoneForm next={next} />

        <div className={styles.info}>
          <h2 className={styles.infoTitle}>이용 순서</h2>
          <ol className={styles.steps}>
            {STEPS.map((text, i) => (
              <li key={text}>
                <span className={styles.stepNo}>{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <dl className={`dl ${styles.meta}`}>
            <dt>참여 매장</dt>
            <dd>{STORES.map((s) => s.shortName).join(" · ")}</dd>
            <dt>번호 이용</dt>
            <dd>쿠폰 보관과 직원 확인에만 사용하며, 광고 문자를 보내지 않습니다.</dd>
          </dl>
          <p className="small">
            자세한 내용은 <Link href="/guide" className={styles.link}>이용 안내</Link>에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
