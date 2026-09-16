import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { safeNext } from "@/components/flow/format";
import { Piece } from "@/components/site/Poster";
import { getMemberSession } from "@/lib/auth/session";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인" };

/** 로그인 — 계산 시 직원에게 말한 휴대폰 번호를 넣으면 그 번호의 쿠폰함이 열린다. 폼은 종이 카드 위에, 안내 줄은 어두운 띠에 본문 글꼴. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/wallet");
  const session = await getMemberSession();
  if (session) redirect(next);

  return (
    <div className={styles.page}>
      <header className={styles.top} aria-labelledby="login-title">
        <h1 id="login-title" className={`plate plate-blue ${styles.h1}`}>로그인</h1>
        <p className={`${styles.strip} ${styles.sub}`}>계산 시 말씀하신 휴대폰 번호로 로그인합니다</p>
        <Piece name="note-today" rotate={5} sizes="110px" className={styles.note} />
      </header>
      <section className={`paper paper-l ${styles.card}`}>
        <PhoneForm next={next} />
        <p className={`help ${styles.help}`}>휴대폰 번호는 쿠폰 확인 용도로만 사용하며 문자는 발송하지 않습니다.</p>
      </section>
    </div>
  );
}
