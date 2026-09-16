import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { HandArrow } from "@/components/site/HandArrow";
import { benefitOf, Piece, plateOf } from "@/components/site/Poster";
import { openStatus } from "@/components/site/StoreHelpers";
import { FAN_PHOTOS } from "@/components/site/storePhotos";
import type { Rules } from "@/lib/config";
import { distanceM, walkMinutes } from "@/lib/geo";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./StoreBlocks.module.css";

/** "15:00 – 다음날 09:00" → "오늘 15:00~09:00 · 지금 영업 중", 휴무 → "오늘 쉬어요" */
function todayLine(store: Store, now: Date): string {
  const st = openStatus(store, now);
  if (st.today === "휴무") return "오늘 쉬어요";
  const hours = st.today.replace(/\s*–\s*(다음날\s*)?/, "~");
  return `오늘 ${hours} · ${st.open ? "지금 영업 중" : /오픈 예정/.test(st.text) ? "곧 열어요" : "오늘은 끝났어요"}`;
}

/** 두 가게 사이 걸어서 몇 분 */
function walkMin(a: Store, b: Store): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 1;
  return walkMinutes(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
}

const FAN_R = [
  [-6, 3, -3],
  [5, -3, 3],
] as const;

/**
 * 1차 · 2차 · 3차 — 가게마다 포스터 간판 조각(기울여 붙임, 누르면 가게 화면), 진짜 사진 세 장의 폴라로이드 부채,
 * 포스터 혜택 조각, 손글씨 영업시간, 초록 스티커 [예약하기] 하나. 블록 사이는 손글씨 화살표 메모.
 */
export function StoreBlocks({ now, rules }: { now: Date; rules: Rules }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section className={s.list} aria-labelledby="stores-title">
      <h2 id="stores-title" className="sr-only">1차 · 2차 · 3차 참여 가게</h2>
      {ordered.map((st, i) => {
        const flip = i % 2 === 1;
        const links = placeLinks(st);
        const notice = rules.storeNotices?.[st.id]?.trim();
        const photos = FAN_PHOTOS[st.id];
        const next = ordered[i + 1];
        const rot = FAN_R[flip ? 1 : 0];
        return (
          <div key={st.id}>
            <article className={`${s.block} ${flip ? s.flip : ""}`} data-store={st.id}>
              <div className={s.top}>
                <Link href={`/stores/${st.id}`} className={`tape ${s.plateLink}`} aria-label={`${st.course.n}차 ${st.shortName} 가게 보기`}>
                  <Piece name={plateOf(st.id)} rotate={flip ? 2 : -2} sizes="300px" priority={i === 0} className={s.plate} />
                </Link>
                {i === 0 && <Piece name="note-again" rotate={6} className={s.noteAgain} sizes="110px" />}
                {i === 1 && <Piece name="note-today" rotate={-5} className={s.noteToday} sizes="120px" />}
              </div>
              <h3 className="sr-only">{st.course.n}차 {st.name}</h3>

              <div className={s.fan}>
                {photos.map((p, k) => {
                  const alt = st.images.find((im) => im.src === p.src)?.alt ?? `${st.shortName} ${p.cap}`;
                  return (
                    <Link key={p.src} href={`/stores/${st.id}`} className={`pola ${s.pola} ${s[`p${k}`]}`} style={{ "--r": `${rot[k]}deg` } as CSSProperties}>
                      <Image src={p.src} alt={alt} width={320} height={320} sizes="180px" style={p.pos ? { objectPosition: p.pos } : undefined} />
                      <span className="cap" aria-hidden="true">{p.cap}</span>
                    </Link>
                  );
                })}
                {i === 0 && <Piece name="mug" rotate={8} className={s.mug} sizes="80px" />}
              </div>

              <div className={s.under}>
                <Piece name={benefitOf(st.id)} rotate={flip ? -2 : 1.5} sizes="240px" className={s.benefit} />
                <p className={`hand hand-w ${s.today}`}>{todayLine(st, now)}</p>
              </div>
              {notice && (
                <div className={`scrap ${s.notice}`} style={{ "--r": "-1.5deg" } as CSSProperties}>
                  <p className={`scrap-in hand ${s.noticeIn}`}><b className={s.noticeDay}>오늘</b> {notice}</p>
                </div>
              )}

              <div className={s.cta}>
                {links ? (
                  <a className="btn btn-naver" href={links.booking} target="_blank" rel="noreferrer">예약하기<span className="sr-only"> — {st.shortName}</span></a>
                ) : (
                  <Link className="btn" href={`/stores/${st.id}`}>가게 보기</Link>
                )}
                <Link href={`/stores/${st.id}`} className="link link-w">사진·메뉴 더 보기</Link>
              </div>
            </article>

            {next && (
              <p className={`hand hand-w ${s.walk}`}>
                <HandArrow className={s.walkArrow} />
                <span>걸어서 {walkMin(st, next)}분 → 다음은 {next.course.n}차 {next.shortName}</span>
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
