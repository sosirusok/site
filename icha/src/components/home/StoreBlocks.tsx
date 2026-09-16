import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { KitDivider, KitPiece, StickerButton } from "@/components/site/Kit";
import { NextStop } from "@/components/site/NextStop";
import { benefitOf, Piece, plateOf } from "@/components/site/Poster";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import { FAN_PHOTOS } from "@/components/site/storePhotos";
import type { Rules, StoreId } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./StoreBlocks.module.css";

/** "15:00 – 다음날 09:00" → "오늘 15:00~09:00 · 지금 영업 중", 휴무 → "오늘 쉬어요" */
function todayLine(store: Store, now: Date): string {
  const st = openStatus(store, now);
  if (st.today === "휴무") return "오늘 쉬어요";
  const hours = st.today.replace(/\s*–\s*(다음날\s*)?/, "~");
  return `오늘 ${hours} · ${nowText(st)}`;
}

/** 혜택 품목 이름들 → "산토리 프리미엄 생맥주" / "와르르요거트(초코쉘) 또는 소주 1병" (DB에 없으면 포스터의 혜택 이름) */
function giftLine(store: Store, names: string[]): string {
  const what = names.length ? names.join(" 또는 ") : store.benefitLabel;
  return `다른 집 쿠폰 보여 주면 ${what} 무료!`;
}

const FAN_R = [
  [-6, 3, -3],
  [5, -3, 3],
] as const;

/** 손글씨 옆에 붙는 오려 낸 술 — 1차는 포스터 맥주잔(키트 cut-beer 가 오면 그것), 2차·3차는 키트가 와야 보인다 */
const CUT: Record<StoreId, string> = { tokyo: "cut-beer", joseon: "cut-makgeolli", wareureu: "cut-soju" };

/**
 * 1차 · 2차 · 3차 — 가게마다 포스터 간판 조각(기울여 붙임, 누르면 가게 화면), 진짜 사진 세 장의 폴라로이드 부채,
 * 포스터 혜택 조각 + 손글씨 영업시간, 그 아래 노란 손글씨 한 줄(다른 집 쿠폰 보여 주면 ○○ 무료!), 초록 스티커 [예약하기] 하나.
 * 부채는 가운데 장이 위로 올라가 있고 양옆 장은 아래로 내려가 있어 손글씨 캡션이 전부 읽힌다. 블록 사이는 크림 메모(다음 집).
 * 3차 블록 아래에는 키트의 와르르맨숀 장식 선(sign-wareureu, 민트 네온 한 줄)만 가늘게 — 글자·테두리에 네온은 없다.
 * gifts: 가게별 혜택 품목 이름(listMenu giftOnly).
 */
export function StoreBlocks({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
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
              </div>

              <div className={s.under}>
                <Piece name={benefitOf(st.id)} rotate={flip ? -2 : 1.5} sizes="240px" className={s.benefit} />
                <p className={`hand hand-w ${s.today}`}>{todayLine(st, now)}</p>
              </div>
              <div className={s.giftRow}>
                <p className={`hand hand-w hand-y ${s.gift}`}>{giftLine(st, gifts[st.id] ?? [])}</p>
                {i === 0 ? <Piece name="mug" rotate={8} className={s.mug} sizes="72px" /> : <KitPiece name={CUT[st.id]} rotate={flip ? -8 : 8} className={s.mug} sizes="72px" />}
              </div>
              {notice && (
                <div className={`scrap ${s.notice}`} style={{ "--r": "-1.5deg" } as CSSProperties}>
                  <p className={`scrap-in hand ${s.noticeIn}`}><b className={s.noticeDay}>오늘</b> {notice}</p>
                </div>
              )}

              <div className={s.cta}>
                {links ? (
                  <StickerButton kind="book" href={links.booking}>예약하기<span className="sr-only"> — {st.shortName}</span></StickerButton>
                ) : (
                  <Link className="btn" href={`/stores/${st.id}`}>가게 보기</Link>
                )}
                <Link href={`/stores/${st.id}`} className="link link-w">사진·메뉴 더 보기</Link>
              </div>
              {!next && <KitDivider name={`sign-${st.id}`} className={s.sign} />}
            </article>

            {next && <NextStop store={st} next={next} className={s.walk} rotate={flip ? 1.5 : -1.5} />}
          </div>
        );
      })}
    </section>
  );
}
