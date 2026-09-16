import Link from "next/link";
import { BRAND, SITE_URL } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { PosterSheet, isPlaceholderSiteUrl, placeQrUrl } from "@/components/admin/PosterSheet";
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
  const placeholder = isPlaceholderSiteUrl();
  const placeUrl = placeQrUrl(store);
  const href = (t: PrintType, id: string) => `/admin/poster?type=${t}&store=${id}`;

  return (
    <>
      <div className={`${ui.pageHead} ${s.noPrint}`}>
        <div>
          <h1 className={ui.pageTitle}>인쇄물</h1>
          <p className={ui.pageDesc}>QR 은 네이버 플레이스 하나만 갑니다. 흰 종이에 검정 글자라 흑백 프린터로도 됩니다.</p>
        </div>
        <div className={ui.pageActions}>
          <PrintButton className={ui.button} warn={placeholder ? `홈페이지 주소가 아직 배포 주소가 아닙니다 (${SITE_URL}). 시트 아래 작은 주소가 이대로 인쇄됩니다. 인쇄할까요?` : null} />
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
      <div className={s.layout}>
        <PosterPreview>{type === "tent" ? <TentSheet store={store} /> : <PosterSheet store={store} />}</PosterPreview>
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
                ? "A4 한 장에 같은 카드 4장이 나옵니다. 점선을 따라 자르면 A6(엽서 크기) 4장. 인쇄 대화상자에서 용지 A4, 여백 \"없음\", 배경 그래픽 켜기."
                : "인쇄 대화상자에서 용지 A4, 여백 \"없음\", 배경 그래픽 켜기. 계산대 옆·입구·화장실 문 안쪽에 붙입니다."}
            </p>
          </div>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>QR 주소</h2>
            <dl className={ui.kv}>
              <dt>플레이스</dt>
              <dd className={ui.mono} style={{ wordBreak: "break-all" }}>
                {placeUrl ? placeUrl.replace(/^https?:\/\//, "") : "미등록 — stores.ts 의 naverPlaceId"}
              </dd>
              <dt>홈페이지</dt>
              <dd className={ui.mono} style={{ wordBreak: "break-all" }}>
                {SITE_URL.replace(/^https?:\/\//, "")}
              </dd>
            </dl>
            {placeholder ? (
              <p className={`${ui.notice} ${ui.noticeWarn}`} style={{ marginTop: 10 }}>
                홈페이지 주소가 배포 주소가 아닙니다. NEXT_PUBLIC_SITE_URL 을 정한 뒤 인쇄하세요.
              </p>
            ) : (
              <p className={ui.help} style={{ marginTop: 10 }}>
                홈페이지 주소는 시트 아래에 작게만 들어갑니다.
              </p>
            )}
          </div>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>문구</h2>
            <p className={ui.small}>
              "{BRAND.eventTag}" · "당일 영수증 한정 · {BRAND.condition}" 는 사장님 포스터 그대로입니다. 매장별 혜택 문구({STORES.map((st) => st.benefitLabel).join(" / ")})는 매장 데이터를 따릅니다.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
