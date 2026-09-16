import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { getAdminSession } from "@/lib/auth/session";
import { Art } from "@/components/art/Art";
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
        <Art name="logo" alt="" className={styles.barLogo} sizes="40px" />
        {BRAND.name} <span>직원 페이지</span>
      </div>
      <div className={styles.center}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <Art name="logo" alt={BRAND.name} width={72} priority />
            <h1 className={styles.title}>{BRAND.name} 직원 페이지</h1>
            <p className={styles.desc}>{sp.reason === "inactive" ? "비활성화된 계정입니다. 총괄 관리자에게 문의하세요." : "매장 직원 계정이나 총괄 계정으로 들어갑니다."}</p>
          </div>
          <AdminLoginForm next={next} />
          <ul className={styles.badges} aria-label="참여 매장">
            {STORES.map((st) => (
              <li key={st.id}>
                <Art name={`badge-${st.id}`} alt={st.shortName} width={110} />
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
