import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CouponTicket, type TicketCoupon, type TicketStore } from "@/components/flow/CouponTicket";
import { Chevron } from "@/components/ui/Chevron";
import { getMemberSession } from "@/lib/auth/session";
import { getCoupon, listMenu } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import { placeLinks } from "@/lib/naver";
import { getStore } from "@/lib/stores";
import styles from "./coupon.module.css";

export const metadata: Metadata = { title: "쿠폰" };

/** 쿠폰 한 장 — 매장색(data-store)으로 티켓·이름·시트가 물든다. 사용 뒤에는 그 매장 네이버 리뷰 버튼. */
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
  const menu = await listMenu(store.id, { includeInactive: true }).catch(() => []);
  const item = menu.find((m) => (coupon.menuItemId && m.id === coupon.menuItemId) || m.name === coupon.menuName);
  const image = item ? (item.imagePath ?? (item.hasImageData ? menuImageUrl(item) : null)) : null;
  const links = placeLinks(store);
  const ts: TicketStore = { id: store.id, shortName: store.shortName, name: store.name, address: store.address, drink: store.drink, image, placeReview: links?.review ?? null, placeHome: links?.home ?? null, placeBooking: links?.booking ?? null };

  return (
    <section className={`wrap ${styles.page}`} data-store={store.id}>
      <p>
        <Link href="/wallet" className={styles.back}><Chevron className="" />쿠폰함</Link>
      </p>
      <CouponTicket coupon={tc} store={ts} />
    </section>
  );
}
