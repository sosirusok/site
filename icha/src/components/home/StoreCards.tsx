import Image from "next/image";
import { Fragment } from "react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import { FAN_PHOTOS, photoAlt } from "@/components/site/storePhotos";
import type { Rules, StoreId } from "@/lib/config";
import { distanceM, walkMinutes } from "@/lib/geo";
import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./home.module.css";

/** 오늘 영업 — 상태 문구와 시간("17:00~03:00", 휴무면 "") */
export function todayParts(store: Store, now: Date): { open: boolean; state: string; hours: string } {
  const st = openStatus(store, now);
  if (st.today === "휴무") return { open: false, state: "휴무", hours: "" };
  return { open: st.open, state: nowText(st), hours: st.today.replace(/\s*–\s*(다음날\s*)?/, "~") };
}

/** 두 매장 사이 걸어서 몇 분 — 좌표가 없으면 1분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

/** 혜택 품목 이름 — DB 혜택 이름들("또는"으로 잇는다), 없으면 포스터의 혜택 이름 */
export function giftWhat(names: string[], fallback: string): string {
  return (names.length ? names : [fallback]).map((t) => t.trim()).join(" 또는 ");
}

/**
 * 참여 매장 세 곳 — 카드 하나에 대표 안주 사진(16:10), 차수·술·영업 상태 배지, 상호, 쿠폰 혜택 한 줄(노란 밑줄), 오늘 시간·출구, [예약하기]·[매장 정보].
 * 카드는 세로로 쌓는다(한 화면 폭). 사진은 storePhotos.ts 의 첫 장.
 */
export function StoreCards({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <Section id="stores" eyebrow="Stores" title="참여 매장" lead="서면역 6번 출구 도보 2~4분 · 세 매장 모두 50m 이내" alt>
      <ul className={s.cards}>
        {ordered.map((st, i) => {
          const links = placeLinks(st);
          const photo = FAN_PHOTOS[st.id][0]!;
          const today = todayParts(st, now);
          const notice = rules.storeNotices?.[st.id]?.trim();
          const what = giftWhat(gifts[st.id] ?? [], st.benefitLabel);
          const prev = ordered[i - 1];
          return (
            <Fragment key={st.id}>
            {prev && <li className={s.walk}><span className={s.walkLine} aria-hidden="true" /><span className="sr-only">{prev.shortName}에서 </span>도보 {walkMin(prev, st)}분<span className={s.walkLine} aria-hidden="true" /></li>}
            <li className={`card ${s.card}`} data-store={st.id}>
              <div className={s.photo}>
                <Image src={photo.src} alt={photoAlt(st.images, photo)} fill priority={i === 0} sizes="(min-width: 480px) 440px, calc(100vw - 40px)" style={{ objectPosition: photo.pos }} className={s.photoImg} />
              </div>
              <div className={s.cardBody}>
                <div className={s.badges}>
                  <span className="badge badge-store">{st.course.n}차</span>
                  <span className="badge">{st.drink}</span>
                  <span className={`badge ${today.open ? "dot-on" : "dot-off"}`}>{today.state}</span>
                </div>
                <h3 className={`h3 ${s.name}`}>{st.name}</h3>
                <p className={s.gift}><span className={s.giftLabel}>쿠폰 혜택</span> <b className="hl">{what} 무료</b></p>
                <p className={`small muted ${s.meta}`}>
                  {today.hours ? `오늘 ${today.hours}` : "오늘 휴무"} · {LOCATIONS[st.id].subway}
                  {notice && <><br /><span className={s.notice}>공지 · {notice}</span></>}
                </p>
                <div className="btn-row">
                  {links ? <Button href={links.booking} variant="naver" srSuffix={` — ${st.shortName}`}>예약하기</Button> : null}
                  <Button href={`/stores/${st.id}`} variant="outline" srSuffix={` — ${st.shortName}`}>매장 정보</Button>
                </div>
              </div>
            </li>
            </Fragment>
          );
        })}
      </ul>
    </Section>
  );
}
