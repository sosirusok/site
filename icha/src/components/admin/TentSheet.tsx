import { BRAND } from "@/lib/config";
import type { Store } from "@/lib/stores";
import { placeQrUrl, qrSvg, siteHost } from "@/components/admin/PosterSheet";
import s from "@/app/admin/(shell)/poster/poster.module.css";

/**
 * 테이블·계산대용 안내물 — A4 한 장에 A6 네 장(2×2, 절취선). 같은 매장 카드 4장.
 * 각 장: 제목(알콜부시기) + 플레이스 QR + "네이버에서 알콜부시기 검색" + 조건 한 줄 + 홈페이지 주소 작게.
 */
export async function TentSheet({ store }: { store: Store }) {
  const url = placeQrUrl(store);
  const qr = url ? await qrSvg(url, "#111111") : null;

  const card = (
    <div className={s.tent}>
      <div className={s.tentTop}>
        <span className={s.headStore}>
          <span className={s.dot} aria-hidden="true" />
          {store.course.n}차 · {store.shortName}
        </span>
        <span className={s.tentTag}>{BRAND.eventTag}</span>
      </div>
      <p className={s.tentTitle}>{BRAND.name}</p>
      <div className={s.tentQrWrap}>
        <div className={s.tentQrFrame}>{qr ? <div className={s.tentQrImg} dangerouslySetInnerHTML={{ __html: qr }} /> : <div className={s.qrMissing}>플레이스 주소 미등록</div>}</div>
        <p className={s.tentQrLabel}>네이버에서 {BRAND.name} 검색</p>
        <p className={s.tentQrHint}>QR 을 찍으면 {store.shortName} 플레이스가 열려요</p>
      </div>
      <p className={s.tentBenefit}>
        {store.shortName} 혜택 · <b>{store.benefitLabel}</b>
      </p>
      <p className={s.tentCondition}>당일 영수증 한정 · {BRAND.condition}</p>
      <p className={s.tentUrl}>{siteHost()}</p>
    </div>
  );

  return (
    <div className={`${s.sheet} ${s.tentSheet}`} data-store={store.id}>
      <div className={s.tentGrid} aria-label="A6 안내물 4장">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={s.tentCell}>
            {card}
          </div>
        ))}
      </div>
    </div>
  );
}
