import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon } from "@/lib/config";
import { getReceipt, listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import { Stamp } from "@/components/ui/Stamp";
import { DrinkIcon } from "@/components/ui/icons";
import { MenuPicker, type PickStore } from "@/components/flow/MenuPicker";
import { fmtDateTime } from "@/components/flow/format";
import styles from "./pick.module.css";

export const metadata: Metadata = { title: "무료 사이드 고르기" };

export default async function PickPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  const session = await getMemberSession();
  if (!session) redirect(`/login?next=/pick/${encodeURIComponent(receiptId)}`);
  if (!/^[0-9a-f-]{36}$/i.test(receiptId)) notFound();

  const receipt = await getReceipt(receiptId);
  // 다른 사람의 영수증은 존재 여부도 알려 주지 않는다
  if (!receipt || receipt.memberId !== session.memberId) notFound();
  if (receipt.couponId) redirect(`/coupons/${receipt.couponId}`);

  const store = receipt.storeId ? getStore(receipt.storeId) : null;

  if (receipt.status !== "approved" || !receipt.storeId || !store) {
    const waiting = receipt.status === "review";
    return (
      <section className={`wrap ${styles.page}`}>
        <div className={`paper ${styles.notice}`}>
          <Stamp text={waiting ? "대기" : receipt.status === "rejected" ? "반려" : "보류"} color={waiting ? "#6b625a" : undefined} size={96} />
          <div>
            <p className={`serif ${styles.noticeTitle}`}>
              {waiting ? "아직 직원이 확인하는 중이에요." : receipt.status === "rejected" ? "받을 수 없었던 영수증이에요." : "매장을 확인하지 못한 영수증이에요."}
            </p>
            <p className={styles.noticeText}>
              {waiting
                ? "승인되면 쿠폰함에 '사이드 고르기' 버튼이 생겨요. 영업 중에는 보통 몇 분이면 끝나요."
                : receipt.status === "rejected"
                  ? "다른 영수증으로 다시 인증할 수 있어요."
                  : "직원에게 문의해 주세요. 쿠폰함에서 상태를 볼 수 있어요."}
            </p>
            <p className={`mono ${styles.noticeMeta}`}>접수 {fmtDateTime(receipt.createdAt)}</p>
          </div>
          <div className={styles.noticeActions}>
            <Link href="/wallet" className="btn">쿠폰함 보기</Link>
            <Link href="/verify" className="btn btn-ghost">영수증 다시 올리기</Link>
          </div>
        </div>
      </section>
    );
  }

  const rules = await getRules();
  const gifts = giftStoresFor(receipt.storeId);
  const stores: PickStore[] = await Promise.all(
    gifts.map(async (s) => {
      const items = await listMenu(s.id, { giftOnly: true });
      return {
        id: s.id,
        shortName: s.shortName,
        name: s.name,
        drink: s.drink,
        headline: s.headline,
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          description: it.description,
          image: it.hasImageData ? { kind: "db" as const, src: `/api/menu-image/${it.id}` } : it.imagePath ? { kind: "static" as const, src: it.imagePath } : null,
        })),
      };
    }),
  );

  return (
    <section className={`wrap ${styles.page}`}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className="eyebrow">무료 사이드 고르기</p>
          <h1 className={`h1 ${styles.title}`}>
            한 접시 고르세요.<br />
            <span className={styles.titleSub}>{gifts.map((s) => s.shortName).join(" 또는 ")}에서 드려요.</span>
          </h1>
        </div>
        <div className={styles.receipt} data-store={store.id}>
          <p className={`eyebrow ${styles.receiptEyebrow}`}>승인된 영수증</p>
          <p className={styles.receiptStore}>
            <DrinkIcon drink={store.drink} size={18} />
            <b>{store.shortName}</b>
          </p>
          <p className={`mono ${styles.receiptMeta}`}>
            {fmtDateTime(receipt.receiptAt ?? receipt.createdAt)} · {receipt.amount == null ? "금액 미확인" : formatWon(receipt.amount)}
          </p>
          <span className={styles.receiptStamp}><Stamp text="승인" size={72} /></span>
        </div>
      </header>

      <MenuPicker receiptId={receipt.id} stores={stores} couponValidDays={rules.couponValidDays} />

      <p className={`small ${styles.foot}`}>
        {store.shortName} 영수증이라 {store.shortName}의 메뉴는 고를 수 없어요. 고른 쿠폰은 쿠폰함에 보관되고, 매장에서 직원에게 보여 주면 돼요.
      </p>
    </section>
  );
}
