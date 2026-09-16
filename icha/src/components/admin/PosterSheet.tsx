import QRCode from "qrcode";
import { BRAND, SITE_URL } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "@/app/admin/(shell)/poster/poster.module.css";

export async function qrSvg(text: string, color: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: color, light: "#00000000" } });
  return svg.replace(/<svg /, '<svg role="img" aria-label="QR 코드" ');
}

/** 배포 주소가 아닌(placeholder·로컬) 사이트 주소인지 — 시트 아래 작은 홈페이지 주소에만 영향 */
export function isPlaceholderSiteUrl(url: string = SITE_URL): boolean {
  return /example\.com|localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

/** QR 이 여는 주소 — 휴대폰에서 바로 열리는 m.place 플레이스 홈 */
export function placeQrUrl(store: Store): string | null {
  return placeLinks(store)?.home ?? null;
}

export const siteHost = () => SITE_URL.replace(/^https?:\/\//, "");

/** 포스터의 릴레이 순서 4단계 */
export const RELAY_STEPS = ["한 매장 이용 후 영수증 지참", "50m 안 다른 매장 방문", "메인안주 1개 주문", "각 매장별 특별 혜택"] as const;

/** 매장 순서(1차→2차→3차)로 정렬한 혜택 목록 */
export const benefitRows = () => [...STORES].sort((a, b) => a.course.n - b.course.n);

/**
 * A4 세로 한 장 — 흰 종이에 큰 것 하나(네이버 플레이스 QR), 제목 하나(알콜부시기), 안내 한 줄.
 * QR 은 플레이스 하나만. 홈페이지 주소는 아래에 작게. 사장님 포스터 문구(영수증 릴레이 EVENT·당일 영수증 한정·테이블당 1회·메인안주 1개)를 그대로 쓴다.
 */
export async function PosterSheet({ store }: { store: Store }) {
  const url = placeQrUrl(store);
  const qr = url ? await qrSvg(url, "#111111") : null;

  return (
    <div className={`${s.sheet} ${s.poster}`} data-store={store.id}>
      <div className={s.head}>
        <span className={s.headStore}>
          <span className={s.dot} aria-hidden="true" />
          {store.course.n}차 · {store.shortName}
          <small>{store.course.line}</small>
        </span>
        <span className={s.headTag}>{BRAND.eventTag}</span>
      </div>

      <div className={s.titleBlock}>
        <h1 className={s.title}>{BRAND.name}</h1>
        <p className={s.titleSub}>소주 · 맥주 · 막걸리 · {BRAND.unionName}</p>
        <p className={s.titleCourse}>{BRAND.course}</p>
      </div>

      <div className={s.qrBlock}>
        <div className={s.qrFrame}>{qr ? <div className={s.qrImg} dangerouslySetInnerHTML={{ __html: qr }} /> : <div className={s.qrMissing}>네이버 플레이스 주소 미등록</div>}</div>
        <p className={s.qrLabel}>네이버에서 {BRAND.name} 검색</p>
        <p className={s.qrHint}>QR 을 찍으면 {store.shortName} 네이버 플레이스가 열려요 · 리뷰 · 메뉴 · 길찾기</p>
      </div>

      <div className={s.rules}>
        <p className={s.rulesTitle}>{BRAND.eventTag}</p>
        <ol className={s.steps}>
          {RELAY_STEPS.map((t, i) => (
            <li key={t} className={s.step}>
              <span className={s.stepNo}>{i + 1}</span>
              <span className={s.stepText}>{t}</span>
            </li>
          ))}
        </ol>
        <ul className={s.benefits}>
          {benefitRows().map((b) => (
            <li key={b.id} data-store={b.id} className={`${s.benefit} ${b.id === store.id ? s.benefitHere : ""}`}>
              <span className={s.dot} aria-hidden="true" />
              <span className={s.benefitStore}>{b.shortName}</span>
              <span className={s.benefitWhat}>{b.benefitLabel}</span>
            </li>
          ))}
        </ul>
        <p className={s.condition}>당일 영수증 한정 · {BRAND.condition}</p>
      </div>

      <div className={s.foot}>
        <span className={s.footUrl}>{siteHost()}</span>
        <span className={s.footSlogan}>{BRAND.slogan}</span>
      </div>
    </div>
  );
}
