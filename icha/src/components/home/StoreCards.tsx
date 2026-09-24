import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import { FAN_PHOTOS, photoAlt } from "@/components/site/storePhotos";
import type { Rules, StoreId } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./home.module.css";

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

/** 참여 매장 세 곳 — 실제 사진과 오늘 상태, 혜택, 예약 동작만 남긴 코스 카드. */
export function StoreCards({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <Section id="stores" tone="mag" title="세 집, 한 코스" lead="각기 다른 술과 안주를 걸어서 50m 안에서" pt={88} pb={92}>
      <ul className={s.panels}>
        {ordered.map((st) => {
          const links = placeLinks(st);
          const photos = FAN_PHOTOS[st.id];
          const photo = photos[0]!;
          const today = todayParts(st, now);
          const notice = rules.storeNotices?.[st.id]?.trim();
          const what = giftWhat(gifts[st.id] ?? [], st.benefitLabel);
          const no = String(st.course.n).padStart(2, "0");
          return (
            <li key={st.id} className={s.panel} data-store={st.id}>
              <div className={s.shot}>
                <Image src={photo.src} alt={photoAlt(st.images, photo)} fill sizes="(min-width: 1100px) 360px, (min-width: 720px) 46vw, calc(100vw - 40px)" style={{ objectPosition: photo.pos }} className={s.shotImg} />
                <div className={s.shotMeta}>
                  <span className={s.shotNo} aria-hidden="true">{no}</span>
                  <span className={s.shotDrink}>{st.course.n}차 · {st.drink}</span>
                </div>
                <p className={s.statusBar}>
                  <span className={`badge ${today.open ? "dot-on" : "dot-off"} ${s.statusBadge}`}>{today.state}</span>
                  <span className={`num ${s.statusHours}`}>{today.hours ? `오늘 ${today.hours}` : "오늘 휴무"}</span>
                </p>
              </div>

              <div className={s.panelBody}>
                <div className={s.storeHeading}>
                  <p className={s.courseLine}>{st.course.line}</p>
                  <h3 id={`store-${st.id}`} className={s.shotName}>{st.shortName}</h3>
                  <p className={s.storeFullName}>{st.name}</p>
                </div>
                <p className={s.storeIntro}>{st.headline}</p>
                <div className={s.giftLine}>
                  <span className={s.giftLabel}>NEXT SPOT BENEFIT</span>
                  <b className={s.giftWhat}>{what} 무료</b>
                </div>
                {notice ? <p className={s.panelNotice}><b>공지</b> {notice}</p> : null}

                <div className={s.panelCtas}>
                  <Button href={`/stores/${st.id}`} variant="outline" srSuffix={` — ${st.shortName}`} className={s.detailBtn}>매장 보기</Button>
                  {links ? <Button href={links.booking} variant="naver" srSuffix={` — ${st.shortName}`} className={s.reserveBtn}>네이버 예약</Button> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
