import Link from "next/link";
import { BRAND, SITE_URL } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { PosterSheet, isPlaceholderSiteUrl, placeQrUrl } from "@/components/admin/PosterSheet";
import { TentSheet } from "@/components/admin/TentSheet";
import { PosterPreview, PrintButton } from "@/components/admin/PosterPreview";
import { TableQrSheets, tableTalkUrl } from "@/components/admin/TableQrSheet";
import { getTTSettings } from "@/lib/tabletalk/settings";
import ui from "@/app/admin/admin.module.css";
import s from "./poster.module.css";

export const metadata = { title: "인쇄물" };

const TYPES = [
  { key: "poster", label: "벽 포스터", size: "A4 1장" },
  { key: "tent", label: "테이블·계산대 안내", size: "A6 ×4" },
  { key: "table", label: "테이블톡 QR", size: "A4 · 8장씩" },
] as const;
type PrintType = (typeof TYPES)[number]["key"];

export default async function PosterPage({ searchParams }: { searchParams: Promise<{ store?: string; type?: string }> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const preferred = session.storeId ?? sp.store;
  const type: PrintType = sp.type === "tent" ? "tent" : sp.type === "table" ? "table" : "poster";
  // 테이블톡 QR 은 서명된 테이블 주소라 매장 직원은 자기 매장 것만(포스터·안내 카드는 공개 정보라 다른 매장도 볼 수 있다)
  const staffOnly = session.role === "staff" && type === "table";
  if (staffOnly && !session.storeId) return <Forbidden what="다른 매장 테이블톡 QR" />;
  const store = (staffOnly ? STORES.find((x) => x.id === session.storeId) : STORES.find((x) => x.id === (sp.store ?? preferred))) ?? STORES[0]!;
  const choices = staffOnly ? STORES.filter((x) => x.id === store.id) : STORES;
  const tt = type === "table" ? (await getTTSettings(true))[store.id] : null;
  const placeholder = isPlaceholderSiteUrl();
  const placeUrl = placeQrUrl(store);
  const href = (t: PrintType, id: string) => `/admin/poster?type=${t}&store=${id}`;

  return (
    <>
      <div className={`${ui.pageHead} ${s.noPrint}`}>
        <div>
          <h1 className={ui.pageTitle}>인쇄물</h1>
          <p className={ui.pageDesc}>
            {type === "table"
              ? "테이블마다 붙이는 테이블톡 QR 입니다. 번호는 가게 테이블 번호와 같아야 합니다(관리자 → 테이블톡에서 테이블 수)."
              : "QR 은 네이버 플레이스 하나만 갑니다. 흰 종이에 검정 글자라 흑백 프린터로도 됩니다."}
          </p>
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
        {type === "table" && tt ? (
          <TableQrSheets store={store} tables={tt.tables} gen={tt.gen} />
        ) : (
          <PosterPreview>{type === "tent" ? <TentSheet store={store} /> : <PosterSheet store={store} />}</PosterPreview>
        )}
        <aside className={`${s.side} ${s.noPrint}`}>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>매장</h2>
            <div className={s.storeChoice}>
              {choices.map((st) => (
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
              {type === "table"
                ? `테이블 ${tt?.tables ?? 0}개 · A4 ${Math.ceil((tt?.tables ?? 0) / 8)}장. 점선을 따라 잘라 테이블 번호에 맞춰 붙입니다. 인쇄 대화상자에서 용지 A4, 여백 "없음", 배경 그래픽 켜기.`
                : type === "tent"
                ? "A4 한 장에 같은 카드 4장이 나옵니다. 점선을 따라 자르면 A6(엽서 크기) 4장. 인쇄 대화상자에서 용지 A4, 여백 \"없음\", 배경 그래픽 켜기."
                : "인쇄 대화상자에서 용지 A4, 여백 \"없음\", 배경 그래픽 켜기. 계산대 옆·입구·화장실 문 안쪽에 붙입니다."}
            </p>
          </div>
          {type === "table" && tt ? (
            <div className={`${ui.panel} ${ui.panelBody}`}>
              <h2 className={ui.sectionTitle}>QR 주소</h2>
              <p className={ui.small}>테이블마다 다른 주소가 들어갑니다. 한 테이블 QR 로 다른 테이블 주소를 만들 수 없게 서명이 붙어 있습니다.</p>
              <p className={ui.mono} style={{ wordBreak: "break-all", marginTop: 8, fontSize: 13 }}>
                1번: {tableTalkUrl(store, 1, tt.gen).replace(/^https?:\/\//, "")}
              </p>
              {placeholder ? (
                <p className={`${ui.notice} ${ui.noticeWarn}`} style={{ marginTop: 10 }}>
                  홈페이지 주소가 배포 주소가 아닙니다. 이대로 인쇄하면 QR 이 열리지 않습니다. NEXT_PUBLIC_SITE_URL 을 정한 뒤 인쇄하세요.
                </p>
              ) : null}
              {!tt.on ? <p className={`${ui.notice} ${ui.noticeWarn}`} style={{ marginTop: 10 }}>이 매장 테이블톡이 꺼져 있습니다. 관리자 → 테이블톡에서 켜세요.</p> : null}
            </div>
          ) : (
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
          )}
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
