import Link from "next/link";
import { BRAND } from "@/lib/config";
import { query } from "@/lib/db";
import { getStore } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { logoutAction } from "@/app/admin/actions";
import { Art } from "@/components/art/Art";
import ui from "@/app/admin/admin.module.css";

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const owner = session.role === "owner";
  const pending = (await query<{ n: number }>(`select count(*)::int as n from receipts where status='review'`).catch(() => []))[0]?.n ?? 0;
  const store = session.storeId ? getStore(session.storeId) : null;

  const items: NavItem[] = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/receipts", label: "영수증 확인", badge: pending || undefined },
    { href: "/admin/coupons", label: "쿠폰 조회" },
    ...(owner
      ? [
          { href: "/admin/members", label: "회원" },
          { href: "/admin/menus", label: "메뉴" },
          { href: "/admin/settings", label: "설정" },
          { href: "/admin/poster", label: "인쇄물" },
          { href: "/admin/staff", label: "직원 계정" },
          { href: "/admin/log", label: "로그" },
        ]
      : [{ href: "/admin/poster", label: "인쇄물" }]),
  ];

  return (
    <>
      <header className={ui.topbar}>
        <div className={ui.topbarInner}>
          <Link href="/admin" className={ui.brand}>
            <Art name="logo" alt="" className={ui.brandLogo} sizes="40px" />
            {BRAND.name}
            <span className={ui.brandSub}>관리자</span>
          </Link>
          <span className={ui.topbarSpacer} />
          <Link href="/" className={ui.siteLink} target="_blank" rel="noreferrer">
            손님 사이트
          </Link>
          <span className={ui.who}>
            <span className={ui.whoName}>{session.name}</span>
            <span className={ui.whoRole}>{owner ? "총괄" : `${store?.shortName ?? "매장"} 직원`}</span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className={ui.logout}>
              로그아웃
            </button>
          </form>
        </div>
      </header>
      <AdminNav items={items} />
      <main className={ui.main}>{children}</main>
    </>
  );
}
