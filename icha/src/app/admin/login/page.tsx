import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { getAdminSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { initialAdminIssue } from "@/lib/db/schema";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const sp = await searchParams;
  const session = await getAdminSession();
  // 초기 관리자 계정을 만들지 못했으면(약한 ADMIN_INITIAL_PASSWORD) 그 사실은 이 화면에서만 알린다
  await getDb().catch(() => null);
  const seedIssue = initialAdminIssue();
  // 로그인 뒤 기본 화면은 카운터 (직원이 계산대에서 가장 먼저 여는 화면)
  const next = sp.next && sp.next.startsWith("/admin") && sp.next !== "/admin/login" && sp.next !== "/admin" ? sp.next : "/admin/counter";
  if (session && sp.reason !== "inactive") redirect(next);
  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        {BRAND.name} <span>직원 페이지</span>
      </div>
      <div className={styles.center}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <h1 className={styles.title}>{BRAND.name}</h1>
            <p className={styles.desc}>{sp.reason === "inactive" ? "비활성화된 계정입니다. 총괄 관리자에게 문의하세요." : "매장 직원 계정이나 총괄 계정으로 들어갑니다."}</p>
            {seedIssue && <p className={styles.warn}>{seedIssue}</p>}
          </div>
          <AdminLoginForm next={next} />
          <ul className={styles.badges} aria-label="참여 매장">
            {STORES.map((st) => (
              <li key={st.id} data-store={st.id}>
                {st.shortName}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={styles.foot}>
        직원 계정은 총괄 관리자가 만듭니다. · <Link href="/">손님 사이트로</Link>
      </p>
    </div>
  );
}
