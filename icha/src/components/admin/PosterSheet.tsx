import QRCode from "qrcode";
import { BRAND, SITE_URL } from "@/lib/config";
import type { Rules } from "@/lib/config";
import { STORES, giftStoresFor, naverPlaceUrl, type Store } from "@/lib/stores";
import { LOCATIONS } from "@/lib/locations";
import s from "@/app/admin/(shell)/poster/poster.module.css";

async function qrSvg(text: string, color: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: color, light: "#00000000" } });
  return svg.replace(/<svg /, '<svg role="img" aria-label="QR 코드" ');
}

/** A4 한 장짜리 매장 포스터 (서버 컴포넌트, 인쇄용). 흰 종이에 검정 활자, 금색·빨강 강조. */
export async function PosterSheet({ store, rules }: { store: Store; rules: Rules }) {
  const others = giftStoresFor(store.id);
  const verifyUrl = `${SITE_URL}/verify?from=${store.id}`;
  const placeUrl = naverPlaceUrl(store);
  const [qrSite, qrPlace] = await Promise.all([qrSvg(verifyUrl, "#111111"), placeUrl ? qrSvg(placeUrl, "#111111") : Promise.resolve(null)]);
  const otherNames = others.map((o) => o.shortName).join("이나 ");
  const no = String(STORES.findIndex((x) => x.id === store.id) + 1).padStart(2, "0");

  return (
    <div className={s.sheet}>
      <div className={s.band}>
        <span className={s.bandBrand}>
          {BRAND.name} <small>{BRAND.hanja} · {BRAND.unionName}</small>
        </span>
        <span className={s.bandStore}>
          <b>{no}</b> {store.shortName} <em>{store.drink}</em>
        </span>
      </div>

      <div className={s.body}>
        <h1 className={s.title}>
          1차 영수증 한 장,
          <br />
          2차 사이드는 <em>공짜.</em>
        </h1>
        <p className={s.sub}>
          여기 {store.shortName} 영수증이면 <b>{otherNames}</b>에서 사이드 메뉴 하나가 무료.
          <br />
          앱도 가입도 없이 전화번호만 넣으면 됩니다.
        </p>

        <ol className={s.steps}>
          <li>
            <span className={s.stepNo}>01</span>
            <div>
              <p className={s.stepTitle}>QR 찍고 영수증 사진 올리기</p>
              <p className={s.stepDesc}>
                결제 후 {rules.receiptValidHours}시간 안 · {rules.minAmount > 0 ? `${rules.minAmount.toLocaleString("ko-KR")}원 이상 · ` : ""}하루 {rules.dailyLimitPerMember}장까지
              </p>
            </div>
          </li>
          <li>
            <span className={s.stepNo}>02</span>
            <div>
              <p className={s.stepTitle}>{otherNames} 사이드 중 하나 고르기</p>
              <p className={s.stepDesc}>{store.shortName} 영수증은 {store.shortName}에서는 못 씁니다. 2차는 옆집으로.</p>
            </div>
          </li>
          <li>
            <span className={s.stepNo}>03</span>
            <div>
              <p className={s.stepTitle}>그 집 직원 앞에서 쿠폰 화면 보여 주기</p>
              <p className={s.stepDesc}>쿠폰은 {rules.couponValidDays}일 동안 유효 · 자주 오면 등급이 올라 사장님 쿠폰이 따로 갑니다</p>
            </div>
          </li>
        </ol>

        <div className={s.qrs}>
          <div className={`${s.qrBox} ${s.qrMain}`}>
            <div className={s.qrImg} dangerouslySetInnerHTML={{ __html: qrSite }} />
            <div>
              <p className={s.qrLabel}>영수증 올리기</p>
              <p className={s.qrHint}>카메라를 대면 바로 인증 화면이 열립니다.</p>
              <p className={s.qrUrl}>{verifyUrl.replace(/^https?:\/\//, "")}</p>
            </div>
          </div>
          <div className={s.qrBox}>
            {qrPlace ? <div className={s.qrImg} dangerouslySetInnerHTML={{ __html: qrPlace }} /> : <div className={s.qrMissing}>네이버 플레이스 주소 미등록</div>}
            <div>
              <p className={s.qrLabel}>네이버 플레이스</p>
              <p className={s.qrHint}>{store.shortName} 메뉴·영업시간·리뷰</p>
              {placeUrl ? <p className={s.qrUrl}>{placeUrl.replace(/^https?:\/\//, "")}</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className={s.foot}>
        <ul className={s.footStores}>
          {STORES.map((st, i) => (
            <li key={st.id} className={st.id === store.id ? s.footHere : ""}>
              <b>{String(i + 1).padStart(2, "0")}</b> {st.shortName} <span>{st.drink}</span>
              <small>{LOCATIONS[st.id].subway.replace(/\s*\(.*\)$/, "")}</small>
            </li>
          ))}
        </ul>
        <p className={s.footNote}>쿠폰은 한 번만 쓸 수 있고 현금으로 바꿀 수 없습니다. 궁금한 점은 직원에게 물어보세요.</p>
      </div>
    </div>
  );
}
