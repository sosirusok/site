import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MenuPicker, type PickStore } from "@/components/flow/MenuPicker";
import { fmtMD } from "@/components/flow/format";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon } from "@/lib/config";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { getReceipt, listMenu, menuImageUrl } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import styles from "./pick.module.css";

export const metadata: Metadata = { title: "한 잔 고르기" };

export default async function PickPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const session = await getMemberSession();
  if (!session) redirect(`/login?next=/pick/${encodeURIComponent(receiptId)}`);
  if (!/^[0-9a-f-]{36}$/i.test(receiptId)) notFound();

  const receipt = await getReceipt(receiptId);
  // 다른 사람의 영수증이나 승인되지 않은 영수증은 존재 여부도 알려 주지 않는다
  if (!receipt || receipt.memberId !== session.memberId) notFound();
  if (receipt.couponId) redirect(`/coupons/${receipt.couponId}`);
  const store = receipt.storeId ? getStore(receipt.storeId) : null;
  if (receipt.status !== "approved" || !receipt.storeId || !store) notFound();

  const rules = await getRules();
  const deadline = pickDeadlineFor(receipt, rules);

  if (isPickExpired(receipt, rules)) {
    return (
      <section className={`wrap ${styles.page}`} aria-labelledby="pick-title">
        <div className={styles.head}>
          <h1 id="pick-title" className="h1">고를 수 있는 기간이 지났어요</h1>
          <p className="cap">{store.shortName} 영수증은 {fmtMD(deadline)}까지 고를 수 있었어요. 새 영수증을 올리면 다시 받아요.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/verify" className="btn btn-block">영수증 올리기</Link>
          <Link href="/wallet" className="btn btn-secondary btn-block">쿠폰함 보기</Link>
        </div>
      </section>
    );
  }

  const gifts = giftStoresFor(receipt.storeId);
  const stores: PickStore[] = await Promise.all(
    gifts.map(async (s) => {
      const items = await listMenu(s.id, { giftOnly: true });
      return {
        id: s.id,
        shortName: s.shortName,
        name: s.name,
        drink: s.drink,
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          description: it.description,
          image: it.hasImageData ? { src: menuImageUrl(it), local: false } : it.imagePath ? { src: it.imagePath, local: true } : null,
        })),
      };
    }),
  );

  return (
    <section className={`wrap ${styles.page}`} aria-labelledby="pick-title">
      <div className={styles.head}>
        <h1 id="pick-title" className="h1">어느 집에서 받을까요?</h1>
        <p className="cap">{store.shortName} 영수증 {receipt.amount == null ? "" : formatWon(receipt.amount)} · {fmtMD(deadline)}까지 골라요</p>
      </div>
      <MenuPicker receiptId={receipt.id} stores={stores} couponValidDays={rules.couponValidDays} />
    </section>
  );
}
