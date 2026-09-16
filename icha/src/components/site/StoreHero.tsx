import Image from "next/image";
import type { Store } from "@/lib/stores";
import { Piece, plateOf } from "./Poster";
import { heroImage, kstNow, nowText, openStatus, parseHours } from "./StoreHelpers";
import { HERO_POS } from "./storePhotos";
import styles from "./StoreHero.module.css";

/**
 * 가게 첫 화면 — 그 집 밤 외관 사진을 화면 폭 그대로, 아래 모서리에 포스터 간판 조각이 겹쳐 붙는다.
 * 보이는 이름은 간판 조각이고 읽히는 이름(h1)은 눈에 안 보이게 같이 둔다.
 * 사진 아래에는 손글씨 한 줄(지금 영업 중·오늘 시간·별점)과 종이 한 장(영업·주소·전화).
 */
export function StoreHero({ store }: { store: Store }) {
  const st = openStatus(store);
  const r = store.naverRating;
  const { dow } = kstNow();
  const photo = heroImage(store);
  const otherDays = parseHours(store)
    .filter((l) => !l.dayset.has(dow))
    .map((l) => `${l.days} ${l.openText}~${l.closeText}`);
  const today = st.today === "휴무" ? "오늘 쉬어요" : `오늘 ${st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "")}`;
  const state = st.today === "휴무" ? "오늘 쉬어요" : nowText(st);
  const sub = [st.lastOrder ? `주문 마감 ${st.lastOrder}` : null, ...otherDays].filter(Boolean).join(" · ");

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.shotWrap}>
          {photo && <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: HERO_POS[store.id] }} className={styles.shot} />}
        </div>
        <h1 className="sr-only">{store.name}</h1>
        <div className={styles.plateWrap}>
          <Piece name={plateOf(store.id)} rotate={-2} priority sizes="320px" className={`tape ${styles.plate}`} />
        </div>
      </header>

      <div className={styles.facts}>
        <p className={`hand hand-w ${styles.now}`}>
          {state} · {today}
          {r && <span className={styles.rating}> · ★ {r.score.toFixed(2)} ({r.count.toLocaleString("ko-KR")})</span>}
        </p>
        <div className={`paper paper-r ${styles.factPaper}`}>
          <dl className="kv">
            {sub && (<><dt>영업</dt><dd className="num">{sub}</dd></>)}
            <dt>주소</dt>
            <dd>{store.address}</dd>
            {store.phone && (
              <>
                <dt>전화</dt>
                <dd><a href={`tel:${store.phone.replace(/-/g, "")}`} className={`link num ${styles.tel}`}>{store.phone}</a></dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </>
  );
}
