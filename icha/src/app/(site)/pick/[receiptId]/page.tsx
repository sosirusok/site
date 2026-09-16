import { menuImageUrl } from "@/lib/menu-image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { formatWon } from "@/lib/config";
import { getReceipt, listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { getStore, giftStoresFor } from "@/lib/stores";
import { MenuPicker, type PickStore } from "@/components/flow/MenuPicker";
import { fmtDateTime, joinNames } from "@/components/flow/format";
import styles from "./pick.module.css";

export const metadata: Metadata = { title: "사이드 메뉴 선택" };

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
    const rejected = receipt.status === "rejected";
    return (
      <section className={`wrap ${styles.page}`}>
        <div className={styles.col}>
          <header className={styles.head}>
            <h1 className="h2">사이드 메뉴 선택</h1>
          </header>
          <div className={styles.notice}>
            <p><span className={`status ${waiting ? "status-wait" : "status-no"}`}>{waiting ? "직원 확인 대기" : rejected ? "반려" : "매장 미확인"}</span></p>
            <p className={styles.noticeText}>
              {waiting
                ? "직원이 영수증 사진을 확인하고 있습니다. 승인되면 쿠폰함에 사이드 메뉴 선택 버튼이 표시됩니다."
                : rejected
                  ? "인정되지 않은 영수증입니다. 다른 영수증으로 다시 인증할 수 있습니다."
                  : "매장을 확인하지 못한 영수증입니다. 매장 직원에게 문의해 주십시오."}
            </p>
            <p className={`mono ${styles.noticeMeta}`}>접수 {fmtDateTime(receipt.createdAt)}</p>
          </div>
          <div className={styles.actions}>
            <Link href="/wallet" className="btn btn-lg btn-block">쿠폰함 보기</Link>
            <Link href="/verify" className="btn btn-outline btn-block">다른 영수증 인증</Link>
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
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          description: it.description,
          image: it.hasImageData ? { kind: "db" as const, src: menuImageUrl(it) } : it.imagePath ? { kind: "static" as const, src: it.imagePath } : null,
        })),
      };
    }),
  );

  return (
    <section className={`wrap ${styles.page}`}>
      <div className={styles.col}>
        <header className={styles.head}>
          <h1 className="h2">사이드 메뉴 선택</h1>
          <p className={styles.lead}>
            {joinNames(gifts.map((s) => s.shortName))}의 사이드 메뉴 중 하나를 선택합니다. {store.shortName} 영수증이므로 {store.shortName} 메뉴는 선택할 수 없습니다.
          </p>
        </header>

        <dl className={`dl ${styles.receipt}`} aria-label="승인된 영수증">
          <dt>영수증 매장</dt>
          <dd>{store.name}</dd>
          <dt>결제 일시</dt>
          <dd className="mono">{fmtDateTime(receipt.receiptAt ?? receipt.createdAt)}</dd>
          <dt>결제 금액</dt>
          <dd className="mono">{receipt.amount == null ? "미확인" : formatWon(receipt.amount)}</dd>
          <dt>상태</dt>
          <dd><b className="red">승인</b></dd>
        </dl>

        <MenuPicker receiptId={receipt.id} stores={stores} couponValidDays={rules.couponValidDays} />
      </div>
    </section>
  );
}
