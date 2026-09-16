import QRCode from "qrcode";
import { SITE_URL } from "@/lib/config";
import type { Rules } from "@/lib/config";
import { giftStoresFor, naverPlaceUrl, type Store } from "@/lib/stores";
import { LOCATIONS } from "@/lib/locations";
import { Art } from "@/components/art/Art";
import { joinWithJosa, josa } from "@/components/admin/format";
import s from "@/app/admin/(shell)/poster/poster.module.css";

export async function qrSvg(text: string, color: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: color, light: "#00000000" } });
  return svg.replace(/<svg /, '<svg role="img" aria-label="QR 코드" ');
}

/** 배포 주소가 아닌(placeholder·로컬) 사이트 주소인지 */
export function isPlaceholderSiteUrl(url: string = SITE_URL): boolean {
  return /example\.com|localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

/** 매장별 증정 품목 이름 (DB is_gift 항목). 비어 있으면 대표 술 이름으로 대신한다. */
export type GiftNames = Partial<Record<string, string[]>>;
export function giftLabel(store: Store, gifts: GiftNames): string {
  const names = gifts[store.id] ?? [];
  return names.length ? names.join("·") : store.drink;
}

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/**
 * A4 세로 한 장짜리 매장 포스터 (서버 컴포넌트, 인쇄용).
 * 흰 종이 위에 사장님 그림(poster-art) 크게, 매장 배지·로고, 사실 문장 제목, 규칙 한 줄, 이용 순서 3줄, QR 두 개.
 * 남색 강조·14px 둥근 모서리. 통색 띠 없이 선만 써서 잉크를 아낀다.
 */
export async function PosterSheet({ store, rules, gifts }: { store: Store; rules: Rules; gifts: GiftNames }) {
  const others = giftStoresFor(store.id);
  const [a, b] = others;
  const verifyUrl = `${SITE_URL}/verify?from=${store.id}`;
  const placeUrl = naverPlaceUrl(store);
  const [qrSite, qrPlace] = await Promise.all([qrSvg(verifyUrl, "#1f2d40"), placeUrl ? qrSvg(placeUrl, "#24211d") : Promise.resolve(null)]);

  const giftSentence =
    a && b
      ? `${a.shortName} ${josa(giftLabel(a, gifts), "이나")} ${b.shortName} ${giftLabel(b, gifts)} 중 하나를 무료로 드려요.`
      : "나머지 두 곳에서 그 집 술 한 잔을 무료로 드려요.";

  const steps = [
    { art: "how-1", text: "계산하고 받은 영수증을 찍어 올려요" },
    { art: "how-2", text: "옆집 두 곳 중 마시고 싶은 쪽을 골라요" },
    { art: "how-3", text: "그 집에서 직원에게 쿠폰 화면을 보여 줘요" },
  ];

  return (
    <div className={`${s.sheet} ${s.poster}`} data-store={store.id}>
      {isPlaceholderSiteUrl() ? <p className={s.warn}>배포 주소가 아닙니다 — 이 포스터는 붙이지 마세요 (NEXT_PUBLIC_SITE_URL: {SITE_URL})</p> : null}

      <div className={s.head}>
        <Art name={`badge-${store.id}`} alt={store.shortName} className={s.headBadge} sizes="240px" />
        <span className={s.headHere}>여기서 계산하셨나요?</span>
        <Art name="logo" alt="이차" className={s.headLogo} sizes="80px" />
      </div>

      <div className={s.artWrap}>
        <Art name={`poster-art-${store.id}`} alt="" className={s.art} sizes="640px" priority />
      </div>

      <h1 className={s.title}>
        이 집 영수증으로
        <br />
        옆집에서 <em>한 잔 더</em> 받아요
      </h1>

      <p className={s.sub}>
        {store.shortName}에서 계산한 영수증 사진을 올리면 {giftSentence} 앱 설치나 가입 없이 전화번호만 넣으면 돼요.
      </p>

      <p className={s.ruleLine}>
        결제 후 <b>{rules.receiptValidHours}시간</b> 안에 올린{rules.minAmount > 0 ? <> <b>{won(rules.minAmount)}</b> 이상</> : null} 영수증이면 돼요 · 하루 {rules.dailyLimitPerMember}장까지 · 쿠폰은 받은 날부터 {rules.couponValidDays}일 안에 써요
      </p>

      <ol className={s.steps}>
        {steps.map((st, i) => (
          <li key={st.art} className={s.step}>
            <Art name={st.art} alt="" className={s.stepArt} sizes="150px" />
            <span className={s.stepNo}>{i + 1}</span>
            <span className={s.stepText}>{st.text}</span>
          </li>
        ))}
      </ol>

      <div className={s.qrs}>
        <div className={`${s.qrBox} ${s.qrBoxMain}`}>
          <div className={s.qrImg} dangerouslySetInnerHTML={{ __html: qrSite }} />
          <div className={s.qrText}>
            <p className={s.qrLabel}>영수증 올리기</p>
            <p className={s.qrHint}>휴대폰 카메라로 찍으면 바로 열려요.</p>
            <p className={s.qrUrl}>{verifyUrl.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
        <div className={s.qrBox}>
          {qrPlace ? <div className={s.qrImg} dangerouslySetInnerHTML={{ __html: qrPlace }} /> : <div className={s.qrMissing}>네이버 플레이스 주소 미등록</div>}
          <div className={s.qrText}>
            <p className={s.qrLabel}>네이버 플레이스</p>
            <p className={s.qrHint}>{store.shortName} 메뉴와 영업시간이 열려요.</p>
            {placeUrl ? <p className={s.qrUrl}>{placeUrl.replace(/^https?:\/\//, "")}</p> : null}
          </div>
        </div>
      </div>

      <div className={s.foot}>
        <p className={s.footRule}>
          {store.shortName} 영수증은 {store.shortName}에서는 쓸 수 없고, 쿠폰은 {joinWithJosa(others.map((o) => o.shortName), "과와")}에서만 써요.
        </p>
        <ul className={s.footStores}>
          {others.map((o) => (
            <li key={o.id}>
              <Art name={`badge-${o.id}`} alt={o.shortName} className={s.footBadge} sizes="150px" />
              <span>
                {LOCATIONS[o.id].subway} · {LOCATIONS[o.id].floor}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
