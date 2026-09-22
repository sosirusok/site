import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MenuPicker, type PickStore } from "@/components/flow/MenuPicker";
import { fmtMD } from "@/components/flow/format";
import { Button } from "@/components/ui/Button";
import { getMemberSession } from "@/lib/auth/session";
import { isPickExpired, pickDeadlineFor } from "@/lib/coupons";
import { getReceipt, listMenu, menuImageUrl } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import styles from "./pick.module.css";

export const metadata: Metadata = { title: "사용 매장 선택" };

/** 받은 쿠폰을 어느 매장 혜택으로 바꿀지 고른다 — 발급 매장을 뺀 두 매장, 포스터 순서(1차→2차→3차). */
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
        <header className={styles.head}>
          <h1 id="pick-title" className="h1">선택 기간 만료</h1>
          <p className="lead">{store.shortName} 발급 쿠폰의 선택 기간이 {fmtMD(deadline)}에 종료되었습니다. 다음 계산 시 휴대폰 번호를 말씀하시면 새 쿠폰이 발급됩니다.</p>
        </header>
        <Button href="/wallet" variant="primary" size="lg" block>쿠폰함 열기</Button>
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
    <section className={styles.page} aria-labelledby="pick-title" data-store={store.id} data-footer="short">
      <header className={styles.head}>
        <h1 id="pick-title" className="h1">사용 매장 선택</h1>
        <p className="lead"><b>{store.shortName}</b>에서 받은 쿠폰입니다. 어느 매장에서 어떤 혜택으로 쓸지 고르세요. {fmtMD(deadline)}까지 선택할 수 있습니다.</p>
      </header>
      <MenuPicker receiptId={receipt.id} stores={stores} couponValidDays={rules.couponValidDays} />
    </section>
  );
}
