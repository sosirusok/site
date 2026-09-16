import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { safeNext } from "@/components/flow/format";
import { getMemberSession } from "@/lib/auth/session";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "휴대폰 번호로 시작" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/verify");
  const session = await getMemberSession();
  if (session) redirect(sp.next ? next : "/wallet");

  return (
    <section className={`wrap ${styles.page}`} aria-labelledby="login-title">
      <div className={styles.head}>
        <h1 id="login-title" className="h1-event">번호로 시작</h1>
        <p className="cap">번호만 넣으면 돼요. 쿠폰은 이 번호에 담겨요.</p>
      </div>
      <PhoneForm next={next} />
      <p className="cap">광고 문자는 보내지 않아요.</p>
    </section>
  );
}
