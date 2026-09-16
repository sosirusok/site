import { SITE_URL } from "@/lib/config";
import type { Rules } from "@/lib/config";
import { giftStoresFor, type Store } from "@/lib/stores";
import { Art } from "@/components/art/Art";
import { josa } from "@/components/admin/format";
import { giftLabel, isPlaceholderSiteUrl, qrSvg, type GiftNames } from "@/components/admin/PosterSheet";
import s from "@/app/admin/(shell)/poster/poster.module.css";

/**
 * 테이블·계산대용 소형 안내물 — A4 한 장에 A6 네 장(2×2, 절취선 점선). 같은 매장 카드 4장.
 * 각 장: tent-art 그림 + 한 줄 안내 + QR(사이트 /verify?from=<id>) + 매장 배지 작게.
 */
export async function TentSheet({ store, rules, gifts }: { store: Store; rules: Rules; gifts: GiftNames }) {
  const verifyUrl = `${SITE_URL}/verify?from=${store.id}`;
  const qr = await qrSvg(verifyUrl, "#1f2d40");
  const others = giftStoresFor(store.id);
  const [a, b] = others;
  const what = a && b ? `${a.shortName} ${josa(giftLabel(a, gifts), "이나")} ${b.shortName} ${giftLabel(b, gifts)} 중 하나예요.` : "나머지 두 곳에서 그 집 술 한 잔이에요.";

  const card = (
    <div className={s.tent}>
      <div className={s.tentTop}>
        <Art name={`badge-${store.id}`} alt={store.shortName} className={s.tentBadge} sizes="160px" />
        <Art name="logo" alt="이차" className={s.tentLogo} sizes="60px" />
      </div>
      <div className={s.tentArtWrap}>
        <Art name={`tent-art-${store.id}`} alt="" className={s.tentArt} sizes="300px" />
      </div>
      <p className={s.tentLine}>
        계산하고 영수증 사진 한 장 올리면
        <br />
        옆집에서 <em>한 잔 무료</em>
      </p>
      <p className={s.tentSub}>
        {what} 결제 후 {rules.receiptValidHours}시간 안에 올리면 돼요.
      </p>
      <div className={s.tentQr}>
        <div className={s.tentQrImg} dangerouslySetInnerHTML={{ __html: qr }} />
        <div>
          <p className={s.tentQrLabel}>영수증 올리기</p>
          <p className={s.tentQrHint}>휴대폰 카메라로 찍으면 바로 열려요.</p>
          <p className={s.tentQrUrl}>{verifyUrl.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${s.sheet} ${s.tentSheet}`} data-store={store.id}>
      {isPlaceholderSiteUrl() ? <p className={`${s.warn} ${s.warnTent}`}>배포 주소가 아닙니다 — 인쇄하지 마세요 (NEXT_PUBLIC_SITE_URL: {SITE_URL})</p> : null}
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
