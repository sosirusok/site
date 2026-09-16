import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Art } from "@/components/art/Art";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { safeNext } from "@/components/flow/format";
import { getMemberSession } from "@/lib/auth/session";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "전화번호로 시작" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/verify");
  const session = await getMemberSession();
  if (session) redirect(sp.next ? next : "/wallet");

  return (
    <section className={`wrap ${styles.page}`} aria-labelledby="login-title">
      <div className={styles.art} aria-hidden="true">
        <Art name="phone-input" sizes="(min-width: 760px) 240px, 55vw" priority />
      </div>
      <div className={styles.text}>
        <h1 id="login-title" className="h1">휴대폰 번호만 넣으면<br />바로 시작돼요</h1>
        <p className={styles.lead}>인증번호 없이 번호만으로 시작해요. 쿠폰은 이 번호에 보관돼요.</p>
      </div>
      <div className={styles.form}>
        <PhoneForm next={next} />
      </div>
      <p className={styles.note}>
        번호는 쿠폰을 보관하고 매장 직원이 확인할 때만 써요. 광고 문자는 보내지 않아요.
      </p>
    </section>
  );
}
