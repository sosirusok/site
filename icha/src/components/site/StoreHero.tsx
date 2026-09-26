import Image from "next/image";
import { placeLinks } from "@/lib/naver";
import type { Store } from "@/lib/stores";
import { kstNow, nowText, openStatus, parseHours } from "./StoreHelpers";
import styles from "./StoreHero.module.css";

/** 술 종류의 영문 라벨 */
const DRINK_EN: Record<string, string> = { 맥주: "BEER", 막걸리: "MAKGEOLLI", 소주: "SOJU" };
const PHOTOS: Record<string, string> = {
  tokyo: "/images/privilege/tokyo-photo.webp",
  joseon: "/images/privilege/joseon-photo.webp",
  wareureu: "/images/privilege/wareureu-photo.webp",
};

/** 홈과 같은 매장 아트워크에 실제 영업 정보와 이동 링크를 이어 붙인다. */
export function StoreHero({ store }: { store: Store }) {
  const st = openStatus(store);
  const r = store.naverRating;
  const { dow } = kstNow();
  const otherDays = parseHours(store)
    .filter((l) => !l.dayset.has(dow))
    .map((l) => `${l.days} ${l.openText}~${l.closeText}`);
  const today = st.today === "휴무" ? "오늘 휴무" : `오늘 ${st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "익일 ")}`;
  const state = st.today === "휴무" ? "휴무" : nowText(st);
  const links = placeLinks(store);

  return (
    <header className={styles.hero}>
      <div className={styles.shotWrap}>
        <Image src={PHOTOS[store.id] ?? PHOTOS.tokyo!} alt={`${store.shortName} 매장 모습`} fill loading="eager" fetchPriority="high" sizes="(min-width: 480px) 480px, 100vw" className={styles.shot} />
      </div>
      <div className={styles.identity}>
        <h1>{store.name}</h1>
        <span>{String(store.course.n).padStart(2, "0")} · {DRINK_EN[store.drink] ?? store.drink}</span>
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
        {/* 오늘 시간 외에 다른 요일의 영업 정보도 함께 제공한다. */}
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
