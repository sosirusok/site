import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { getCoupon } from "@/lib/db/queries";
import { getStore } from "@/lib/stores";
import { CouponTicket, type TicketCoupon, type TicketStore } from "@/components/flow/CouponTicket";
import { storeNo } from "@/components/flow/format";
import styles from "./coupon.module.css";

export const metadata: Metadata = { title: "쿠폰" };

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getMemberSession();
  if (!session) redirect(`/login?next=/coupons/${encodeURIComponent(id)}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const coupon = await getCoupon(id);
  // 남의 쿠폰은 존재 여부도 알려 주지 않는다
  if (!coupon || coupon.memberId !== session.memberId) notFound();
  const store = getStore(coupon.useStoreId);
  if (!store) notFound();

  const tc: TicketCoupon = {
    id: coupon.id,
    code: coupon.code,
    menuName: coupon.menuName,
    status: coupon.status,
    kind: coupon.kind,
    issuedAt: coupon.issuedAt.toISOString(),
    expiresAt: coupon.expiresAt.toISOString(),
    usedAt: coupon.usedAt?.toISOString() ?? null,
    note: coupon.note,
  };
  const ts: TicketStore = { id: store.id, no: storeNo(store.id), shortName: store.shortName, name: store.name, drink: store.drink, address: store.address };

  return (
    <section className={`wrap ${styles.page}`}>
      <p className={styles.back}>
        <Link href="/wallet">← 쿠폰함</Link>
      </p>
      <CouponTicket coupon={tc} store={ts} />
    </section>
  );
}
