import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import { photoAlt, type FanPhoto } from "@/components/site/storePhotos";
import type { Rules, StoreId } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./home.module.css";

const ROUTE_COPY: Record<StoreId, { kicker: string; photo: FanPhoto }> = {
  tokyo: {
    kicker: "첫 잔은 생맥주",
    photo: { src: "/images/stores/tokyo/cold-ham-plate-beers.jpg", cap: "생맥주와 콜드햄 플레이트", pos: "50% 52%" },
  },
  joseon: {
    kicker: "두 번째는 막걸리",
    photo: { src: "/images/stores/joseon/haemul-pajeon.jpg", cap: "해물파전", pos: "50% 54%" },
  },
  wareureu: {
    kicker: "마지막은 소주",
    photo: { src: "/images/stores/wareureu/chadol-yukjeon.jpg", cap: "차돌육전 한 판", pos: "50% 50%" },
  },
};

/** 오늘 영업 — 상태 문구와 시간("17:00~03:00", 휴무면 "") */
export function todayParts(store: Store, now: Date): { open: boolean; state: string; hours: string } {
  const st = openStatus(store, now);
  if (st.today === "휴무") return { open: false, state: "휴무", hours: "" };
  return { open: st.open, state: nowText(st), hours: st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "익일 ") };
}

/** 혜택 품목 이름 — DB 혜택 이름들("또는"으로 잇는다), 없으면 포스터의 혜택 이름 */
export function giftWhat(names: string[], fallback: string): string {
  return (names.length ? names : [fallback]).map((t) => t.trim()).join(" 또는 ");
}

/** 참여 매장 세 곳 — 카드 반복 대신 한 골목을 따라 읽는 세 개의 편집 행. */
export function StoreCards({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <Section id="stores" tone="mag" title="한 골목, 서로 다른 세 집" lead="맥주에서 막걸리, 소주까지. 모두 걸어서 이동합니다." pt={96} pb={104} className={s.storeSection}>
      <ul className={s.panels}>
        {ordered.map((st) => {
          const links = placeLinks(st);
          const route = ROUTE_COPY[st.id];
          const photo = route.photo;
          const today = todayParts(st, now);
          const notice = rules.storeNotices?.[st.id]?.trim();
          const what = giftWhat(gifts[st.id] ?? [], st.benefitLabel);
          const no = String(st.course.n).padStart(2, "0");
          return (
            <li key={st.id} className={s.panel} data-store={st.id} data-course={no}>
              <div className={s.routeHead}>
                <span className={s.routeNo} aria-hidden="true">{no}</span>
                <p className={s.routeKicker}>{route.kicker}</p>
              </div>
              <div className={s.shot}>
                <Image src={photo.src} alt={photoAlt(st.images, photo)} fill sizes="(min-width: 1100px) 56vw, (min-width: 720px) 54vw, calc(100vw - 36px)" style={{ objectPosition: photo.pos }} className={s.shotImg} />
              </div>

              <div className={s.panelBody}>
                <div className={s.storeHeading}>
                  <h3 id={`store-${st.id}`} className={s.shotName}>{st.shortName}</h3>
                  <p className={s.storeFullName}>{st.name}</p>
                </div>
                <p className={s.storeIntro}>{st.headline}</p>
                <dl className={s.routeFacts}>
                  <div>
                    <dt>오늘</dt>
                    <dd><span className={today.open ? s.openDot : s.closedDot} aria-hidden="true" />{today.state}{today.hours ? <span className={s.statusHours}> · {today.hours}</span> : null}</dd>
                  </div>
                  <div>
                    <dt>쿠폰 혜택</dt>
                    <dd className={s.giftWhat}>{what} 무료</dd>
                  </div>
                </dl>
                {notice ? <p className={s.panelNotice}><b>공지</b> {notice}</p> : null}

                <div className={s.panelCtas}>
                  <Button href={`/stores/${st.id}`} variant="outline" srSuffix={` — ${st.shortName}`} className={s.detailBtn}>매장 자세히 <span aria-hidden="true">→</span></Button>
                  {links ? <Button href={links.booking} variant="naver" srSuffix={` — ${st.shortName}`} className={s.reserveBtn}>네이버 예약 <span aria-hidden="true">↗</span></Button> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
