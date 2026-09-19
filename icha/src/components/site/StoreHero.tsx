import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { placeLinks } from "@/lib/naver";
import type { Store } from "@/lib/stores";
import { kstNow, nowText, openStatus, parseHours } from "./StoreHelpers";
import { HERO_PHOTO } from "./storePhotos";
import styles from "./StoreHero.module.css";

/** 술 종류의 영문 라벨 */
const DRINK_EN: Record<string, string> = { 맥주: "BEER", 막걸리: "MAKGEOLLI", 소주: "SOJU" };

/**
 * 매장 첫 화면 — 그 가게의 실제 밤 간판 사진(HERO_PHOTO)을 듀오톤 전면(4:3)으로 깔고,
 * 그 위에 속 빈 거대 차수 숫자(120px)와 Black Han Sans 상호(36px, 네온 번짐).
 * 아래 갤러리 첫 장(대표 안주)과 같은 사진을 쓰면 한 화면에 같은 접시가 두 번 나온다 — 그래서 간판 사진을 따로 둔다.
 * 사진 아래 형광 상태 띠 → 한 줄 소개 → 거대한 별점 숫자(Anton 44px) → 영업시간·주소 표(라벨은 Anton 형광) → 초록 예약 바 + 네온 아웃라인.
 */
export function StoreHero({ store }: { store: Store }) {
  const st = openStatus(store);
  const r = store.naverRating;
  const { dow } = kstNow();
  const photo = HERO_PHOTO[store.id];
  const alt = store.images.find((im) => im.src === photo.src)?.alt ?? photo.cap;
  const otherDays = parseHours(store)
    .filter((l) => !l.dayset.has(dow))
    .map((l) => `${l.days} ${l.openText}~${l.closeText}`);
  const today = st.today === "휴무" ? "오늘 휴무" : `오늘 ${st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "익일 ")}`;
  const state = st.today === "휴무" ? "휴무" : nowText(st);
  const links = placeLinks(store);

  return (
    <header className={styles.hero}>
      <div className={`duo ${styles.shotWrap}`}>
        <Image src={photo.src} alt={alt} fill priority sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: photo.pos }} className={styles.shot} />
        <span className={`duo-over ${styles.shotNo}`} aria-hidden="true">{String(store.course.n).padStart(2, "0")}</span>
        <div className={`duo-over ${styles.shotText}`}>
          <span className={`lbl ${styles.shotDrink}`}>{store.course.n}차 · {DRINK_EN[store.drink] ?? store.drink}</span>
          <h1 className={`h1 ${styles.name}`}>{store.name}</h1>
        </div>
      </div>

      <p className={styles.statusBar}>
        <span className={`badge ${st.open ? "dot-on" : "dot-off"} ${styles.statusBadge}`}>{state}</span>
        <span className={`num ${styles.statusHours}`}>{today}</span>
        {st.lastOrder && <span className={styles.statusLo}>주문 마감 {st.lastOrder}</span>}
      </p>

      <div className={styles.body}>
        <p className="lead">{store.headline}</p>
        {r && (
          <p className={styles.rating}>
            <span className={styles.score}>{r.score.toFixed(2)}</span>
            <span className={styles.ratingBody}>
              <span className={styles.stars} aria-hidden="true">★★★★★</span>
              <span className={styles.ratingSub}>네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개</span>
            </span>
          </p>
        )}
        <dl className={`kv ${styles.kv}`}>
          <dt>영업시간</dt>
          <dd className="num">{today}{otherDays.length > 0 && <span className={styles.other}>{otherDays.join(" · ")}</span>}</dd>
          <dt>주소</dt>
          <dd>{store.address}</dd>
        </dl>
        {/* id 는 아래 고정 바가 본다 — 이 줄이 화면에 보이는 동안에는 고정 바를 내려 둔다(초록 예약 버튼이 한 화면에 둘 보이지 않게) */}
        <div className="btn-row" id="hero-cta">
          {links && <Button href={links.booking} variant="naver" srSuffix={` — ${store.shortName}`}>네이버 예약</Button>}
          {links && <Button href={links.home} variant="outline" srSuffix={` — ${store.shortName}`}>플레이스</Button>}
        </div>
      </div>
    </header>
  );
}
