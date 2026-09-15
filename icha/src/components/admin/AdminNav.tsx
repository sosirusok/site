"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ui from "@/app/admin/admin.module.css";

export type NavItem = { href: string; label: string; badge?: number };

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav className={ui.navbar} aria-label="관리자 메뉴">
      <div className={ui.navInner}>
        {items.map((it) => (
          <Link key={it.href} href={it.href} className={`${ui.navLink} ${isActive(it.href) ? ui.navLinkActive : ""}`} aria-current={isActive(it.href) ? "page" : undefined}>
            {it.label}
            {it.badge ? <span className={ui.navBadge}>{it.badge}</span> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
