import Link from "next/link";
import { SITE_URL } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { PosterSheet } from "@/components/admin/PosterSheet";
import { PosterPreview, PrintButton } from "@/components/admin/PosterPreview";
import ui from "@/app/admin/admin.module.css";
import s from "./poster.module.css";

export const metadata = { title: "포스터" };

export default async function PosterPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const preferred = session.storeId ?? sp.store;
  const store = STORES.find((x) => x.id === (sp.store ?? preferred)) ?? STORES[0]!;
  const rules = await getRules();

  return (
    <>
      <div className={`${ui.pageHead} ${s.noPrint}`}>
        <div>
          <h1 className={ui.pageTitle}>매장 포스터</h1>
          <p className={ui.pageDesc}>A4 한 장. 테이블·계산대·화장실 문 안쪽에 붙입니다. 인쇄 대화상자에서 여백을 "없음", 배경 그래픽을 켜 주세요.</p>
        </div>
        <div className={ui.pageActions}>
          <PrintButton className={ui.button} />
        </div>
      </div>
      <div className={s.layout}>
        <PosterPreview>
          <PosterSheet store={store} rules={rules} />
        </PosterPreview>
        <aside className={`${s.side} ${s.noPrint}`}>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>매장</h2>
            <div className={s.storeChoice}>
              {STORES.map((st) => (
                <Link key={st.id} href={`/admin/poster?store=${st.id}`} data-store={st.id} className={`${s.storeBtn} ${st.id === store.id ? s.storeBtnActive : ""}`} aria-current={st.id === store.id ? "true" : undefined}>
                  <span className={ui.storeDot} aria-hidden="true" />
                  {st.shortName}
                </Link>
              ))}
            </div>
          </div>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>QR 주소</h2>
            <dl className={ui.kv}>
              <dt>인증</dt>
              <dd className={ui.mono} style={{ wordBreak: "break-all" }}>
                {SITE_URL}/verify?from={store.id}
              </dd>
              <dt>플레이스</dt>
              <dd className={ui.mono} style={{ wordBreak: "break-all" }}>
                {store.naverPlaceId ? `map.naver.com/p/entry/place/${store.naverPlaceId}` : "미등록 — stores.ts 의 naverPlaceId"}
              </dd>
            </dl>
            <p className={ui.help} style={{ marginTop: 10 }}>
              사이트 주소는 NEXT_PUBLIC_SITE_URL 환경변수를 따릅니다. 배포 주소가 아니면 QR 이 로컬을 가리키니 배포 후 다시 인쇄하세요.
            </p>
          </div>
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <h2 className={ui.sectionTitle}>문구에 쓰인 규칙</h2>
            <p className={ui.small}>
              인정 {rules.receiptValidHours}시간 · 최소 {rules.minAmount.toLocaleString("ko-KR")}원 · 쿠폰 {rules.couponValidDays}일. 바꾸려면 <Link href="/admin/settings" style={{ textDecoration: "underline" }}>설정</Link>에서.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
