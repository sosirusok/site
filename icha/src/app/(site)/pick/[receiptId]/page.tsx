import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { MenuPicker, type PickStore } from "@/components/flow/MenuPicker";
import { fmtMD, fmtMDHM } from "@/components/flow/format";
import { getMemberSession } from "@/lib/auth/session";
import { REASONS, formatWon } from "@/lib/config";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { getReceipt, listMenu } from "@/lib/db/queries";
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
        <div className={styles.expiredArt} aria-hidden="true">
          <Art name="wallet-expired" sizes="(min-width: 760px) 220px, 50vw" priority />
        </div>
        <h1 id="pick-title" className="h1">고를 수 있는 기간이 지났어요</h1>
        <p className={styles.lead}>
          {REASONS.PICK_EXPIRED} {store.shortName} 영수증은 {fmtMD(deadline)}까지 고를 수 있었어요. 새 영수증을 올리면 다시 받을 수 있어요.
        </p>
        <div className={styles.actions}>
          <ArtButton kind="start" href="/verify" width={340} />
          <Link href="/wallet" className="btn btn-outline">쿠폰함 보기</Link>
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
        items: items.map((it) => ({ id: it.id, name: it.name, price: it.price, description: it.description })),
      };
    }),
  );

  return (
    <section className={`wrap ${styles.page}`} aria-labelledby="pick-title">
      <div className={styles.scene} aria-hidden="true">
        <Art name={`pick-from-${store.id}`} sizes="(min-width: 760px) 360px, 80vw" priority />
      </div>
      <h1 id="pick-title" className="h1">
        {store.shortName} 영수증이에요.<br />나머지 두 집 중 한 곳에서 한 잔 고르세요.
      </h1>
      <p className={styles.meta}>
        {fmtMDHM(receipt.receiptAt ?? receipt.createdAt)} · {receipt.amount == null ? "금액 확인 중" : formatWon(receipt.amount)} · {fmtMD(deadline)}까지 고를 수 있어요
      </p>
      <div className={styles.picker}>
        <MenuPicker receiptId={receipt.id} stores={stores} couponValidDays={rules.couponValidDays} />
      </div>
    </section>
  );
}
