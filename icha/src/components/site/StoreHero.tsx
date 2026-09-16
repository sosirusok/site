import Image from "next/image";
import type { Store } from "@/lib/stores";
import { heroImage, kstNow, openStatus, parseHours } from "./StoreHelpers";
import { StoreSign } from "./StoreSign";
import { HERO_POS } from "./storePhotos";
import styles from "./StoreHero.module.css";

/**
 * 가게 첫 화면 — 그 집 밤 사진 한 장에 네온 간판이 켜진다.
 * 보이는 이름은 간판 사진이고, 읽히는 이름(h1)은 눈에 안 보이게 같이 둔다.
 * 사진 아래에는 영업·주소·전화만 가는 선으로. 초록 버튼은 화면 아래 고정 버튼 하나뿐이다.
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
  const state = st.open ? "지금 영업 중" : st.today === "휴무" ? "오늘 쉬어요" : /오픈 예정/.test(st.text) ? "곧 열어요" : "오늘 영업 끝";
  const sub = [st.lastOrder ? `주문 마감 ${st.lastOrder}` : null, ...otherDays].filter(Boolean).join(" · ");

  return (
    <>
      <header className={`frame bleed-top ${styles.hero}`}>
        {photo && <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: HERO_POS[store.id] }} className={styles.shot} />}
        <span className={`vignette ${styles.layer}`} aria-hidden="true" />
        <span className={`scrim ${styles.layer}`} aria-hidden="true" />
        <span className={`grain ${styles.layer}`} aria-hidden="true" />
        <div className={styles.body}>
          <p className={styles.kick}>
            <span className={styles.no} aria-hidden="true">{store.course.n}차</span>
            <span className={`on-photo ${styles.kickText}`}>{store.drink}</span>
          </p>
          <h1 className="sr-only">{store.name}</h1>
          <StoreSign id={store.id} className={styles.sign} priority sizes="(min-width: 480px) 380px, 80vw" />
          <p className={`on-photo ${styles.line}`}>{store.course.line}</p>
          <p className={`on-photo ${styles.meta}`}>
            <b className={st.open ? styles.open : styles.closed}>{state}</b>
            {st.today !== "휴무" && <span className="num">{today}</span>}
            {r && <span className={`num ${styles.rating}`}>★ {r.score.toFixed(2)} ({r.count.toLocaleString("ko-KR")})</span>}
          </p>
        </div>
      </header>

      <div className={`wrap ${styles.facts}`}>
        {sub && (
          <p className={styles.fact}>
            <span className={styles.factK}>영업</span>
            <span className={`num ${styles.factV}`}>{sub}</span>
          </p>
        )}
        <p className={styles.fact}>
          <span className={styles.factK}>주소</span>
          <span className={styles.factV}>{store.address}</span>
        </p>
        {store.phone && (
          <p className={styles.fact}>
            <span className={styles.factK}>전화</span>
            <span className={styles.factV}>
              <a href={`tel:${store.phone.replace(/-/g, "")}`} className={`num ${styles.tel}`}>{store.phone}</a>
            </span>
          </p>
        )}
      </div>
    </>
  );
}
