import QRCode from "qrcode";
import { BRAND, SITE_URL } from "@/lib/config";
import type { Rules } from "@/lib/config";
import { STORES, giftStoresFor, naverPlaceUrl, type Store } from "@/lib/stores";
import { LOCATIONS } from "@/lib/locations";
import { joinWithJosa } from "@/components/admin/format";
import s from "@/app/admin/(shell)/poster/poster.module.css";

async function qrSvg(text: string, color: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: color, light: "#00000000" } });
  return svg.replace(/<svg /, '<svg role="img" aria-label="QR 코드" ');
}

/** 배포 주소가 아닌(placeholder·로컬) 사이트 주소인지 */
export function isPlaceholderSiteUrl(url: string = SITE_URL): boolean {
  return /example\.com|localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

/**
 * A4 한 장짜리 매장 포스터 (서버 컴포넌트, 인쇄용). 매장에 붙이는 인쇄물이며 손님 사이트에는 나오지 않는다.
 * 흰 종이에 검정 활자, 빨강 한 줄. 표어 없이 사실만.
 */
export async function PosterSheet({ store, rules }: { store: Store; rules: Rules }) {
  const others = giftStoresFor(store.id);
  const otherNames = joinWithJosa(others.map((o) => o.shortName), "이나");
  const verifyUrl = `${SITE_URL}/verify?from=${store.id}`;
  const placeUrl = naverPlaceUrl(store);
  const [qrSite, qrPlace] = await Promise.all([qrSvg(verifyUrl, "#111111"), placeUrl ? qrSvg(placeUrl, "#111111") : Promise.resolve(null)]);
  const no = String(STORES.findIndex((x) => x.id === store.id) + 1).padStart(2, "0");
  const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

  return (
    <div className={s.sheet}>
      {isPlaceholderSiteUrl() ? <p className={s.warn}>배포 주소가 아닙니다 — 이 포스터는 붙이지 마세요 (NEXT_PUBLIC_SITE_URL: {SITE_URL})</p> : null}
      <div className={s.head}>
        <span className={s.headBrand}>
          {BRAND.name} {BRAND.hanja}
          <small>{BRAND.unionName}</small>
        </span>
        <span className={s.headStore}>
          <b>{no}</b>
          {store.shortName}
          <span>{store.drink}</span>
        </span>
      </div>

      <h1 className={s.title}>
        {store.shortName} 영수증 인증 시
        <br />
        {otherNames}에서
        <br />
        사이드 메뉴 1개 <em>무료</em>
      </h1>
      <p className={s.sub}>
        {BRAND.ruleOneLiner}
        <br />
        앱 설치·회원 가입·인증번호 없이 휴대폰 번호만 입력하면 됩니다.
      </p>

      <table className={s.steps}>
        <tbody>
          <tr>
            <th>1</th>
            <td>
              <b>{store.shortName}에서 결제</b>
              <span>카드·현금 모두 됩니다. 영수증(카드 매출전표·현금영수증)을 받아 두세요.</span>
            </td>
          </tr>
          <tr>
            <th>2</th>
            <td>
              <b>아래 QR로 들어가 영수증 사진 인증</b>
              <span>
                결제 후 {rules.receiptValidHours}시간 안
                {rules.minAmount > 0 ? ` · ${won(rules.minAmount)} 이상 결제` : ""} · 하루 {rules.dailyLimitPerMember}장까지 · 승인번호가 보이게 찍어 주세요
              </span>
            </td>
          </tr>
          <tr>
            <th>3</th>
            <td>
              <b>{otherNames} 사이드 메뉴 중 1개 선택</b>
              <span>승인일부터 {rules.couponValidDays}일 안에 고르면 쿠폰이 전화번호 쿠폰함에 들어갑니다.</span>
            </td>
          </tr>
          <tr>
            <th>4</th>
            <td>
              <b>그 매장에서 직원 확인 후 쿠폰 사용</b>
              <span>쿠폰 유효 기간 {rules.couponValidDays}일 · 1회 사용 · 현금으로 바꿀 수 없습니다.</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p className={s.rule}>{store.shortName} 영수증은 {store.shortName}에서 쓸 수 없습니다. 쿠폰은 {otherNames}에서만 사용됩니다.</p>

      <div className={s.qrs}>
        <div className={s.qrBox}>
          <div className={s.qrImg} dangerouslySetInnerHTML={{ __html: qrSite }} />
          <div>
            <p className={s.qrLabel}>영수증 인증</p>
            <p className={s.qrHint}>카메라를 대면 인증 화면이 열립니다.</p>
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

      <div className={s.foot}>
        <ul className={s.footStores}>
          {STORES.map((st, i) => (
            <li key={st.id} className={st.id === store.id ? s.footHere : ""}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              {st.shortName}
              <span>{st.drink}</span>
              <small>{LOCATIONS[st.id].subway} · {LOCATIONS[st.id].floor}</small>
            </li>
          ))}
        </ul>
        <p className={s.footNote}>영수증 사진은 부정 사용 확인에만 쓰고 매장 관리자 외에는 볼 수 없습니다. 궁금한 점은 직원에게 물어보세요.</p>
      </div>
    </div>
  );
}
