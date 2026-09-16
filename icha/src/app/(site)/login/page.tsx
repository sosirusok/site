import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { safeNext } from "@/components/flow/format";
import { getMemberSession } from "@/lib/auth/session";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "번호로 시작" };

/** 번호 하나로 시작 — 계산할 때 직원에게 말한 번호를 넣으면 그 번호의 쿠폰함이 열린다. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/wallet");
  const session = await getMemberSession();
  if (session) redirect(next);

  return (
    <section className={`wrap ${styles.page}`} aria-labelledby="login-title">
      <div className={styles.head}>
        <h1 id="login-title" className="h1-event">번호로 시작</h1>
        <p className="cap">계산할 때 말한 번호 그대로 넣으면 쿠폰이 보여요.</p>
      </div>
      <PhoneForm next={next} />
      <p className="cap">문자는 보내지 않아요. 번호는 쿠폰을 찾는 데만 써요.</p>
    </section>
  );
}
