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
              <span className={styles.ratingSub}>네이버 방문자 리뷰 {r.count.toLocaleString("ko-KR")}개</span>
            </span>
          </p>
        )}
        {/* 오늘 영업시간은 바로 위 형광 띠에 이미 있다. 여기서는 다른 요일과 주소만, 표가 아니라 줄로 */}
        {otherDays.length > 0 && <p className={`num ${styles.other}`}>{otherDays.join(" · ")}</p>}
        <p className={styles.addr}>
          {store.address}
          {links && <> <a href={links.directions} target="_blank" rel="noopener noreferrer" className={styles.addrLink}>길찾기<span className="sr-only"> — {store.shortName}</span></a></>}
        </p>
        {/* 예약·길찾기·전화는 아래 고정 바에 있다. 여기서는 플레이스로 가는 텍스트 링크 하나만 —
            섹션마다 CTA 를 하나씩 달면 실제 가게 페이지보다 버튼 밀도가 높아진다.
            id 는 고정 바가 본다(이 줄이 보이는 동안에는 바를 내려 둔다). */}
        <div id="hero-cta">
          {links && <a href={links.home} target="_blank" rel="noopener noreferrer" className={styles.placeLink}>네이버 플레이스에서 보기<span className="sr-only"> — {store.shortName}</span></a>}
        </div>
      </div>
    </header>
  );
}
