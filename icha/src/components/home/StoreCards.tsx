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
  return { open: st.open, state: nowText(st), hours: st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "익일 ") };
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

/** 술 종류의 영문 라벨 — Anton 으로 사진 위에 얹는다 */

/**
 * 참여 매장 세 곳 — 화면 폭을 꽉 채우는 "플라이어 패널" 셋. 카드 그리드가 아니다.
 *   듀오톤으로 그레이딩한 4:3 전면 사진 → 그 위에 속 빈 거대 차수 숫자(01/02/03, 96px)와 Black Han Sans 상호(34px),
 *   사진 아래 형광 띠 한 줄(영업 상태·오늘 시간) → 라임 발광 혜택 줄 → 사진 가로 스크롤 스트립 → 초록 예약 바 + 네온 아웃라인.
 * 홀수·짝수 패널은 숫자와 상호가 반대쪽에 붙는다(전부 같은 모양이 아니다).
 */
export function StoreCards({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <Section id="stores" head="slab" tone="yellow" title="오늘 밤 세 집" lead="서면역 6번 출구 도보 2~4분 · 세 매장 모두 50m 이내" alt flush pt={54} pb={30}>
      <ul className={s.panels}>
        {ordered.map((st, i) => {
          const links = placeLinks(st);
          const photos = FAN_PHOTOS[st.id];
          const photo = photos[0]!;
          const today = todayParts(st, now);
          const notice = rules.storeNotices?.[st.id]?.trim();
          const what = giftWhat(gifts[st.id] ?? [], st.benefitLabel);
          const prev = ordered[i - 1];
          const no = String(st.course.n).padStart(2, "0");
          // 집마다 사진 비율·숫자 위치·혜택 줄 모양·썸네일 수를 다르게 준다.
          // 성격이 다른 세 가게(서서 마시는 생맥주집 / 칼국수·막걸리 / 요리주점)를 같은 틀에 부으면 틀이 먼저 보인다.
          const shape = ["a", "b", "c"][i] ?? "a";
          const shownThumbs = photos.slice(0, [2, 3, 2][i] ?? 2);
          return (
            <Fragment key={st.id}>
              {prev && (
                <li className={s.walk} data-store={st.id} data-shape={shape}>
                  <span className={s.walkText}>
                    <span className="sr-only">{prev.shortName}에서 </span>
                    {i === 1 ? <>걸어서 {walkMin(prev, st)}분</> : <>길 건너 {walkMin(prev, st)}분</>}
                  </span>
                </li>
              )}
              <li className={s.panel} data-store={st.id} data-shape={shape}>
                <div className={`duo duo-food ${s.shot}`}>
                  <Image src={photo.src} alt={photoAlt(st.images, photo)} fill priority={i === 0} sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: photo.pos }} className={s.shotImg} />
                  <span className={`duo-over ${s.shotNo}`} aria-hidden="true">{no}</span>
                </div>
                {/* 상호는 사진 안에 가두지 않는다 — 사진 경계를 물고 내려와 아래 검은 띠를 침범한다 */}
                <div className={s.shotText}>
                  <span className={s.shotDrink}>{st.course.n}차 · {st.drink}</span>
                  <h3 className={`h1 ${s.shotName}`}>{st.name}</h3>
                </div>

                <p className={s.statusBar}>
                  <span className={`badge ${today.open ? "dot-on" : "dot-off"} ${s.statusBadge}`}>{today.state}</span>
                  <span className={`num ${s.statusHours}`}>{today.hours ? `오늘 ${today.hours}` : "오늘 휴무"}</span>
                  <span className={s.statusWalk}>{LOCATIONS[st.id].subway}</span>
                </p>

                <div className={s.panelBody}>
                  <p className={s.giftLine}>
                    <span className={s.giftLabel}>쿠폰 혜택</span>
                    <b className={`hl ${s.giftWhat}`}>{what} 무료</b>
                  </p>
                  {notice && <p className={s.panelNotice}><b>공지</b> {notice}</p>}

                  <ul className={`strip ${s.thumbs}`} aria-label={`${st.shortName} 사진`}>
                    {shownThumbs.map((p) => (
                      <li key={p.src} className={s.thumb}>
                        <span className={`duo duo-soft duo-food ${s.thumbFrame}`}>
                          <Image src={p.src} alt={photoAlt(st.images, p)} fill sizes="150px" style={{ objectPosition: p.pos }} className={s.thumbImg} />
                        </span>
                        <span className={s.thumbCap}>{p.cap}</span>
                      </li>
                    ))}
                  </ul>

                  {/* 버튼 차례도 집마다 다르게 — 세 번 같은 자리에 같은 쌍이 오면 그게 틀이다 */}
                  <div className={`btn-row ${s.panelCtas}`}>
                    {shape === "b" && <Button href={`/stores/${st.id}`} variant="outline" srSuffix={` — ${st.shortName}`}>메뉴 보기</Button>}
                    {links ? <Button href={links.booking} variant="naver" srSuffix={` — ${st.shortName}`}>예약하기</Button> : null}
                    {shape !== "b" && <Button href={`/stores/${st.id}`} variant="outline" srSuffix={` — ${st.shortName}`}>{shape === "a" ? "매장 정보" : "안주 더 보기"}</Button>}
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
