import ui from "@/app/admin/admin.module.css";
import { COUPON_STATUS, RECEIPT_STATUS } from "./format";

const toneClass: Record<string, string> = { ok: ui.badgeOk!, warn: ui.badgeWarn!, bad: ui.badgeBad!, info: ui.badgeInfo!, muted: "" };

export function Badge({ tone = "muted", children }: { tone?: "ok" | "warn" | "bad" | "info" | "muted"; children: React.ReactNode }) {
  return <span className={`${ui.badge} ${toneClass[tone] ?? ""}`}>{children}</span>;
}

export function ReceiptBadge({ status }: { status: string }) {
  const s = RECEIPT_STATUS[status] ?? { label: status, tone: "muted" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function CouponBadge({ status }: { status: string }) {
  const s = COUPON_STATUS[status] ?? { label: status, tone: "muted" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
