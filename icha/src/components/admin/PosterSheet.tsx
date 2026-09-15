import QRCode from "qrcode";
import { BRAND, SITE_URL } from "@/lib/config";
import type { Rules } from "@/lib/config";
import { STORES, giftStoresFor, naverPlaceUrl, type Store } from "@/lib/stores";
import s from "@/app/admin/(shell)/poster/poster.module.css";

async function qrSvg(text: string, color: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: color, light: "#00000000" } });
  return svg.replace(/<svg /, '<svg role="img" aria-label="QR 코드" ');
}

/** A4 한 장짜리 매장 포스터 (서버 컴포넌트, 인쇄용) */
export async function PosterSheet({ store, rules }: { store: Store; rules: Rules }) {
  const others = giftStoresFor(store.id);
  const verifyUrl = `${SITE_URL}/verify?from=${store.id}`;
  const placeUrl = naverPlaceUrl(store);
  const [qrSite, qrPlace] = await Promise.all([qrSvg(verifyUrl, store.accentInk), placeUrl ? qrSvg(placeUrl, "#1a1714") : Promise.resolve(null)]);
  const otherNames = others.map((o) => o.shortName).join("과 ");

  return (
    <div className={s.sheet} data-store={store.id}>
      <div className={s.band}>
        <span className={s.bandUnion}>{BRAND.unionName} · 영수증 하나로 두 집</span>
        <span className={s.bandStore}>{store.shortName}</span>
      </div>
      <div className={s.body}>
        <div>
          <div className={s.eyebrow}>
            {BRAND.name} {BRAND.hanja} — {store.name}
          </div>
          <h1 className={s.title}>
            이 영수증,
            <br />
            <em>옆집에서</em>
            <br />
            한 접시 됩니다.
          </h1>
        </div>
        <div className={s.rules}>
          <div className={s.rule}>
            <span className={s.ruleNo}>1</span>
            <p className={s.ruleText}>
              오늘 {store.shortName}에서 결제한 영수증을 사진으로 올립니다.
              <small>
                결제 후 {rules.receiptValidHours}시간 안 · {rules.minAmount > 0 ? `${rules.minAmount.toLocaleString("ko-KR")}원 이상 · ` : ""}전화번호만으로 시작
              </small>
            </p>
          </div>
          <div className={s.rule}>
            <span className={s.ruleNo}>2</span>
            <p className={s.ruleText}>
              {otherNames} 중 한 곳의 사이드 메뉴 하나를 고릅니다.
              <small>{store.shortName} 영수증은 {store.shortName}에서 쓸 수 없습니다. 2차는 옆집으로.</small>
            </p>
          </div>
          <div className={s.rule}>
            <span className={s.ruleNo}>3</span>
            <p className={s.ruleText}>
              그 집에서 직원에게 쿠폰 화면을 보여 주면 끝.
              <small>쿠폰은 {rules.couponValidDays}일 동안 유효 · 누적 금액에 따라 단골 혜택이 더 있습니다</small>
            </p>
          </div>
        </div>
        <div className={s.qrs}>
          <div className={s.qrBox}>
            <div dangerouslySetInnerHTML={{ __html: qrSite }} />
            <div>
              <div className={s.qrLabel}>영수증 올리기</div>
              <p className={s.qrHint}>카메라로 찍으면 바로 인증 화면이 열립니다.</p>
              <div className={s.qrUrl}>{verifyUrl.replace(/^https?:\/\//, "")}</div>
            </div>
          </div>
          <div className={s.qrBox}>
            {qrPlace ? <div dangerouslySetInnerHTML={{ __html: qrPlace }} /> : <div className={s.qrMissing}>네이버 플레이스 주소가 아직 등록되지 않았습니다</div>}
            <div>
              <div className={s.qrLabel}>네이버 플레이스</div>
              <p className={s.qrHint}>{store.shortName} 위치·영업시간·리뷰</p>
              {placeUrl ? <div className={s.qrUrl}>{placeUrl.replace(/^https?:\/\//, "")}</div> : null}
            </div>
          </div>
        </div>
      </div>
      <div className={s.foot}>
        <div>
          <div className={s.footBrand}>
            {BRAND.name}
            <small>{BRAND.hanja}</small>
          </div>
          <div className={s.footStores} style={{ marginTop: "2mm" }}>
            {STORES.map((st) => (
              <span key={st.id} data-store={st.id}>
                <i aria-hidden="true" />
                {st.shortName}
              </span>
            ))}
          </div>
        </div>
        <p className={s.footNote}>
          쿠폰은 한 번만 쓸 수 있고 현금으로 바꿀 수 없습니다.
          <br />
          궁금한 점은 직원에게 물어보세요.
        </p>
      </div>
    </div>
  );
}
