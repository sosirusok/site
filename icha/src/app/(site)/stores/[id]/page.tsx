import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { giftWhat } from "@/components/home/StoreCards";
import { NextStop } from "@/components/site/NextStop";
import { StoreGallery } from "@/components/site/StoreGallery";
import { StoreHero } from "@/components/site/StoreHero";
import { MenuThumb, StoreMenu } from "@/components/site/StoreMenu";
import { StoreReviews } from "@/components/site/StoreReviews";
import { StoreVisit } from "@/components/site/StoreVisit";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { BRAND, formatWon, STORE_IDS, type StoreId } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { getRules } from "@/lib/settings";
import { getStore } from "@/lib/stores";
import styles from "./page.module.css";

/** 정적(ISR) — 세 매장을 빌드 때 만들어 두고 60초마다 뒤에서 새로 만든다. 관리자가 메뉴·공지를 저장하면 revalidatePath("/stores/[id]") 로 바로. 없는 id 는 notFound(그 결과도 60초 캐시). */
export const revalidate = 60;

export function generateStaticParams(): { id: StoreId }[] {
  return STORE_IDS.map((id) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = getStore(id);
  if (!store) return { title: "페이지를 찾을 수 없습니다" };
  return {
    title: store.name,
    description: `${BRAND.name} ${store.course.n}차 ${store.name} · ${store.address} · 다른 매장 쿠폰 제시 시 ${store.benefitLabel} 무료`,
  };
}

/**
 * 매장 화면 — 사진·상호·영업 정보(StoreHero) → (공지) → 쿠폰 혜택(노란 상자 + 품목 줄) → 사진 → 메뉴 → 오시는 길 → 리뷰 → 다음 매장.
 * 아래 고정 바에 [예약하기](네이버 예약) 하나.
 */
export default async function StorePage({ params }: Props) {
  const { id } = await params;
  const store = getStore(id);
  if (!store) notFound();

  const [menu, gifts, rules] = await Promise.all([
    listMenu(store.id).catch(() => []),
    listMenu(store.id, { giftOnly: true }).catch(() => []),
    getRules(),
  ]);
  const links = placeLinks(store);
  const notice = rules.storeNotices[store.id]?.trim() ?? "";
  const reviewBenefit = rules.reviewBenefit[store.id]?.trim() ?? "";
  const what = giftWhat(gifts.map((g) => g.name), store.benefitLabel);

  return (
    <article className={styles.page} data-store={store.id}>
      <StoreHero store={store} />

      {notice && <p className={styles.notice}><b className={styles.noticeTag}>공지</b>{notice}</p>}

      <Section id="gift" eyebrow="Coupon" title="쿠폰 혜택" lead="다른 매장에서 받은 쿠폰을 이 매장에서 쓰면">
        <div className={`box-brand ${styles.giftBox}`}>
          <p className={styles.giftLine}><b>{what}</b> 무료</p>
          <p className="small muted">{BRAND.condition}{gifts.length > 1 ? " · 택 1" : ""}</p>
        </div>
        {gifts.length > 0 && (
          <ul className={styles.giftList}>
            {gifts.map((g) => (
              <li key={g.id} className={styles.gift}>
                <MenuThumb m={g} size={56} />
                <span className={styles.giftBody}>
                  <span className={styles.giftName}>{g.name}</span>
                  {g.description && <span className={`small muted ${styles.giftDesc}`}>{g.description}</span>}
                </span>
                <span className={styles.giftPrice}>
                  {g.price != null && <s className="strike num">{formatWon(g.price)}</s>}
                  <span className="badge badge-brand">무료</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="photos" eyebrow="Photos" title="사진" alt>
        <StoreGallery store={store} photoUrl={links?.photo ?? null} />
      </Section>

      <Section id="menu" eyebrow="Menu" title="메뉴" lead={items(menu.length)}>
        <StoreMenu store={store} items={menu} menuUrl={links?.menu ?? null} />
      </Section>

      <Section id="visit" eyebrow="Map" title="오시는 길" lead="세 매장 모두 50m 이내" alt>
        <StoreVisit store={store} />
      </Section>

      {(store.quotes.length > 0 || store.naverRating) && (
        <Section id="reviews" eyebrow="Reviews" title="리뷰">
          <StoreReviews store={store} limit={2} reviewUrl={links?.review ?? null} benefit={reviewBenefit || null} />
        </Section>
      )}

      <div className={styles.next}>
        <NextStop store={store} />
      </div>

      {links && (
        <div className="fixed-col sticky-bar">
          <div className="btn-row">
            <Button href={links.booking} variant="naver" size="lg" className="btn-main" srSuffix={` — ${store.shortName}`}>네이버 예약하기</Button>
            <Button href={links.directions} variant="outline" size="lg" srSuffix={` — ${store.shortName}`}>길찾기</Button>
            {store.phone && <Button href={`tel:${store.phone.replace(/-/g, "")}`} variant="outline" size="lg" srSuffix={` ${store.phone}`}>전화</Button>}
          </div>
        </div>
      )}
    </article>
  );
}

function items(n: number): string {
  return n > 0 ? `${n}개 · 쿠폰 혜택 품목이 맨 위에 있습니다` : "준비 중";
}
