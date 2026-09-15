import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/config";
import { getAdminSession } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const sp = await searchParams;
  const session = await getAdminSession();
  const next = sp.next && sp.next.startsWith("/admin") && sp.next !== "/admin/login" ? sp.next : "/admin";
  if (session && sp.reason !== "inactive") redirect(next);
  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        {BRAND.name} <span>관리자</span>
      </div>
      <div className={styles.center}>
        <div className={styles.card}>
          <h1 className={styles.title}>관리자 로그인</h1>
          <p className={styles.desc}>{sp.reason === "inactive" ? "비활성화된 계정입니다. 총괄 관리자에게 문의하세요." : "매장 직원 계정 또는 총괄 계정으로 들어갑니다."}</p>
          <AdminLoginForm next={next} />
        </div>
      </div>
      <p className={styles.foot}>
        직원 계정은 총괄 관리자가 만듭니다. · <Link href="/">손님 사이트로</Link>
      </p>
    </div>
  );
}
