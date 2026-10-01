import { SITE_URL } from "@/lib/config";
import type { Store } from "@/lib/stores";
import { tableCode } from "@/lib/tabletalk/code";
import { qrSvg } from "@/components/admin/PosterSheet";
import { PosterPreview } from "@/components/admin/PosterPreview";
import s from "@/app/admin/(shell)/poster/poster.module.css";

const PER_SHEET = 8;

/** 테이블 n 번의 QR 이 여는 주소 */
export function tableTalkUrl(store: Store, table: number, gen: number): string {
  return `${SITE_URL.replace(/\/$/, "")}/t/${tableCode(store.id, table, gen)}`;
}

/**
 * 테이블톡 QR — A4 한 장에 8장, 테이블 수만큼 여러 장. 점선대로 잘라 테이블에 붙인다.
 * 번호가 크게 보여야 손님이 "몇 번 테이블에 말 걸지"를 고개 들어 찾을 수 있다.
 */
export async function TableQrSheets({ store, tables, gen }: { store: Store; tables: number; gen: number }) {
  const cards = await Promise.all(
    Array.from({ length: tables }, async (_, i) => {
      const n = i + 1;
      return { n, svg: await qrSvg(tableTalkUrl(store, n, gen), "#111111") };
    }),
  );
  const sheets: (typeof cards)[] = [];
  for (let i = 0; i < cards.length; i += PER_SHEET) sheets.push(cards.slice(i, i + PER_SHEET));

  return (
    <div className={s.ttPages}>
      {sheets.map((page, pi) => (
        <PosterPreview key={pi}>
          <div className={`${s.sheet} ${s.ttSheet}`} data-store={store.id}>
            <div className={s.ttGrid} aria-label={`테이블 QR ${pi * PER_SHEET + 1}~${pi * PER_SHEET + page.length}번`}>
              {page.map((c) => (
                <div key={c.n} className={s.ttCell}>
                  <div className={s.ttLeft}>
                    <span className={s.ttKicker}>TABLE TALK</span>
                    <span className={s.ttNo}>
                      <span className={s.ttNoNum}>{c.n}</span>
                      <span className={s.ttNoUnit}>번 테이블</span>
                    </span>
                    <span className={s.ttStore}>
                      <span className={s.dot} aria-hidden="true" />
                      {store.shortName}
                    </span>
                    <span className={s.ttLine}>
                      QR 찍고
                      <br />
                      다른 테이블에 말 걸기
                    </span>
                  </div>
                  <div className={s.ttRight}>
                    <div className={s.ttQr} dangerouslySetInnerHTML={{ __html: c.svg }} />
                    <span className={s.ttQrLabel}>테이블톡</span>
                  </div>
                </div>
              ))}
              {Array.from({ length: PER_SHEET - page.length }, (_, i) => (
                <div key={`e${i}`} className={s.ttEmpty} aria-hidden="true" />
              ))}
            </div>
          </div>
        </PosterPreview>
      ))}
    </div>
  );
}
