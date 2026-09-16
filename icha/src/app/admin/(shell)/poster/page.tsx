import Link from "next/link";
import { SITE_URL } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { listMenu } from "@/lib/db/queries";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { PosterSheet, isPlaceholderSiteUrl, type GiftNames } from "@/components/admin/PosterSheet";
import { TentSheet } from "@/components/admin/TentSheet";
import { PosterPreview, PrintButton } from "@/components/admin/PosterPreview";
import ui from "@/app/admin/admin.module.css";
import s from "./poster.module.css";

export const metadata = { title: "인쇄물" };

const TYPES = [
  { key: "poster", label: "벽 포스터", size: "A4 1장" },
  { key: "tent", label: "테이블·계산대 안내", size: "A6 ×4" },
] as const;
type PrintType = (typeof TYPES)[number]["key"];

export default async function PosterPage({ searchParams }: { searchParams: Promise<{ store?: string; type?: string }> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const preferred = session.storeId ?? sp.store;
  const store = STORES.find((x) => x.id === (sp.store ?? preferred)) ?? STORES[0]!;
  const type: PrintType = sp.type === "tent" ? "tent" : "poster";
  const [rules, giftRows] = await Promise.all([getRules(), Promise.all(STORES.map(async (st) => [st.id, (await listMenu(st.id, { giftOnly: true })).map((m) => m.name)] as const))]);
  const gifts: GiftNames = Object.fromEntries(giftRows);
  const placeholder = isPlaceholderSiteUrl();
  const href = (t: PrintType, id: string) => `/admin/poster?type=${t}&store=${id}`;

  return (
    <>
      <div className={`${ui.pageHead} ${s.noPrint}`}>
        <div>
          <h1 className={ui.pageTitle}>매장 인쇄물</h1>
          <p className={ui.pageDesc}>매장에 붙이거나 테이블에 세우는 인쇄물입니다 (손님 사이트에는 표시되지 않습니다). 흰 종이에 선만 써서 흑백 프린터로도 됩니다.</p>
        </div>
        <div className={ui.pageActions}>
          <PrintButton className={ui.button} warn={placeholder ? `사이트 주소가 배포 주소가 아닙니다 (${SITE_URL}). QR 이 로컬을 가리키는 인쇄물을 인쇄할까요?` : null} />
        </div>
      </div>
      <div className={`${s.typeTabs} ${s.noPrint}`} role="tablist" aria-label="인쇄물 종류">
        {TYPES.map((t) => (
          <Link key={t.key} href={href(t.key, store.id)} className={`${s.typeTab} ${t.key === type ? s.typeTabActive : ""}`} role="tab" aria-selected={t.key === type}>
            {t.label}
            <small>{t.size}</small>
          </Link>
        ))}
      </div>
      {placeholder ? (
        <p className={`${ui.notice} ${ui.noticeWarn} ${s.noPrint}`} style={{ marginBottom: 12 }}>
          NEXT_PUBLIC_SITE_URL 이 배포 주소가 아니라 QR 이 <span className={ui.mono}>{SITE_URL}</span> 을 가리킵니다. 배포 후 다시 인쇄하세요. 시트 위에도 같은 경고가 인쇄됩니다.
        </p>
      ) : null}
      <div className={s.layout}>
        <PosterPreview>{type === "tent" ? <TentSheet store={store} rules={rules} gifts={gifts} /> : <PosterSheet store={store} rules={rules} gifts={gifts} />}</PosterPreview>
        <aside className={`${s.side} ${s.noPrint}`}>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>매장</h2>
            <div className={s.storeChoice}>
              {STORES.map((st) => (
                <Link key={st.id} href={href(type, st.id)} data-store={st.id} className={`${s.storeBtn} ${st.id === store.id ? s.storeBtnActive : ""}`} aria-current={st.id === store.id ? "true" : undefined}>
                  <span className={ui.storeDot} aria-hidden="true" />
                  {st.shortName}
                </Link>
              ))}
            </div>
          </div>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>인쇄</h2>
            <p className={ui.small}>
              {type === "tent"
                ? "A4 한 장에 같은 카드 4장이 나옵니다. 점선을 따라 자르면 A6(엽서 크기) 4장이 됩니다. 인쇄 대화상자에서 용지 A4, 여백 \"없음\", 배경 그래픽 켜기."
                : "인쇄 대화상자에서 용지 A4, 여백 \"없음\", 배경 그래픽 켜기. 테이블·계산대·화장실 문 안쪽에 붙입니다."}
            </p>
          </div>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>QR 주소</h2>
            <dl className={ui.kv}>
              <dt>인증</dt>
              <dd className={ui.mono} style={{ wordBreak: "break-all" }}>
                {SITE_URL}/verify?from={store.id}
              </dd>
              {type === "poster" ? (
                <>
                  <dt>플레이스</dt>
                  <dd className={ui.mono} style={{ wordBreak: "break-all" }}>
                    {store.naverPlaceId ? `map.naver.com/p/entry/place/${store.naverPlaceId}` : "미등록 — stores.ts 의 naverPlaceId"}
                  </dd>
                </>
              ) : null}
            </dl>
            <p className={ui.help} style={{ marginTop: 10 }}>
              사이트 주소는 NEXT_PUBLIC_SITE_URL 환경변수를 따릅니다.
            </p>
          </div>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>문구에 쓰인 값</h2>
            <p className={ui.small}>
              인정 {rules.receiptValidHours}시간 · 최소 {rules.minAmount.toLocaleString("ko-KR")}원 · 하루 {rules.dailyLimitPerMember}장 · 쿠폰 {rules.couponValidDays}일 — <Link href="/admin/settings" style={{ textDecoration: "underline" }}>설정</Link>에서 바꿉니다. 증정 품목 이름은{" "}
              <Link href="/admin/menus" style={{ textDecoration: "underline" }}>메뉴</Link>의 "무료 증정" 항목을 그대로 씁니다.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
