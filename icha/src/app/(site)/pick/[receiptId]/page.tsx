import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MenuPicker, type PickStore } from "@/components/flow/MenuPicker";
import { fmtMD } from "@/components/flow/format";
import { getMemberSession } from "@/lib/auth/session";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { getReceipt, listMenu, menuImageUrl } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import styles from "./pick.module.css";

export const metadata: Metadata = { title: "어디서 받을까요?" };

/** 받은 쿠폰을 어느 매장 혜택으로 바꿀지 고른다 — 넣어 준 매장을 뺀 두 매장, 포스터 순서(1차→2차→3차). */
export default async function PickPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const session = await getMemberSession();
  if (!session) redirect(`/login?next=/pick/${encodeURIComponent(receiptId)}`);
  if (!/^[0-9a-f-]{36}$/i.test(receiptId)) notFound();

  const receipt = await getReceipt(receiptId);
  // 다른 사람의 쿠폰이나 아직 확인되지 않은 건은 존재 여부도 알려 주지 않는다
  if (!receipt || receipt.memberId !== session.memberId) notFound();
  if (receipt.couponId) redirect(`/coupons/${receipt.couponId}`);
  const store = receipt.storeId ? getStore(receipt.storeId) : null;
  if (receipt.status !== "approved" || !receipt.storeId || !store) notFound();

  const rules = await getRules();
  const deadline = pickDeadlineFor(receipt, rules);

  if (isPickExpired(receipt, rules)) {
    return (
      <section className={styles.page} aria-labelledby="pick-title">
        <div className={styles.head}>
          <h1 id="pick-title" className={`plate plate-red ${styles.h1}`}>기간이 지났어요</h1>
          <p className={`hand hand-w ${styles.sub}`}>{store.shortName}에서 받은 쿠폰은 {fmtMD(deadline)}까지 고를 수 있었어요. 다음에 계산할 때 번호를 말하면 다시 받아요.</p>
        </div>
        <Link href="/wallet" className="btn btn-block">쿠폰함 보기</Link>
      </section>
    );
  }

  const gifts = [...giftStoresFor(receipt.storeId)].sort((a, b) => a.course.n - b.course.n);
  const stores: PickStore[] = await Promise.all(
    gifts.map(async (s) => {
      const items = await listMenu(s.id, { giftOnly: true });
      return {
        id: s.id,
        shortName: s.shortName,
        name: s.name,
        drink: s.drink,
        course: s.course,
        placeHome: placeLinks(s)?.home ?? null,
        placeBooking: placeLinks(s)?.booking ?? null,
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
    <section className={styles.page} aria-labelledby="pick-title" data-store={store.id}>
      <div className={styles.head}>
        <h1 id="pick-title" className={`plate plate-red ${styles.h1}`}>어디서 받을까요?</h1>
        <p className={`hand hand-w ${styles.sub}`}>{store.shortName}에서 받은 쿠폰 · {fmtMD(deadline)}까지 골라요</p>
      </div>
      <MenuPicker receiptId={receipt.id} stores={stores} couponValidDays={rules.couponValidDays} />
    </section>
  );
}
