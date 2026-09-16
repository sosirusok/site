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

/** 오늘 영업 — 상태 칩 문구(영업 중 / 영업 전 · 17:00 오픈 / 영업 종료 / 휴무)와 시간("15:00~09:00", 휴무면 "") */
function todayParts(store: Store, now: Date): { open: boolean; state: string; hours: string } {
  const st = openStatus(store, now);
  if (st.today === "휴무") return { open: false, state: "휴무", hours: "" };
  return { open: st.open, state: nowText(st), hours: st.today.replace(/\s*–\s*(다음날\s*)?/, "~") };
}

/** 혜택 한 줄(고정형): "다른 매장 쿠폰 제시 시 {품목} 무료" — 품목은 DB 혜택 이름들, 없으면 포스터의 혜택 이름 */
function giftLine(store: Store, names: string[]): string {
  const what = names.length ? names.join(" 또는 ") : store.benefitLabel;
  return `다른 매장 쿠폰 제시 시 ${what} 무료`;
}

const FAN_R = [
  [-6, 3, -3],
  [5, -3, 3],
] as const;

/** 혜택 조각 옆에 붙는 오려 낸 술(장식) — 1차는 포스터 맥주잔(키트 cut-beer 가 오면 그것), 2차·3차는 키트가 와야 보인다 */
const CUT: Record<StoreId, string> = { tokyo: "cut-beer", joseon: "cut-makgeolli", wareureu: "cut-soju" };

/**
 * 1차 · 2차 · 3차 — 매장마다 포스터 간판 조각(기울여 붙임, 누르면 매장 화면), 진짜 사진 세 장의 폴라로이드 부채(캡션 없음),
 * 포스터 혜택 조각, 그 아래 정보 종이 한 장(영업 상태 칩 + 시간 / 혜택 한 줄 / 공지), 초록 스티커 [예약하기] 하나.
 * 정보 글자는 전부 본문 글꼴로 종이 위에 — 보케 위에 손글씨로 정보를 쓰지 않는다. 블록 사이는 다음 매장 종이 한 줄.
 * 3차 블록 아래에는 키트의 와르르맨숀 장식 선(sign-wareureu)만 가늘게.
 * gifts: 매장별 혜택 품목 이름(listMenu giftOnly).
 */
export function StoreBlocks({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section className={s.list} aria-labelledby="stores-title">
      <h2 id="stores-title" className="sr-only">참여 매장</h2>
      {ordered.map((st, i) => {
        const flip = i % 2 === 1;
        const links = placeLinks(st);
        const notice = rules.storeNotices?.[st.id]?.trim();
        const photos = FAN_PHOTOS[st.id];
        const next = ordered[i + 1];
        const rot = FAN_R[flip ? 1 : 0];
        const today = todayParts(st, now);
        return (
          <div key={st.id}>
            <article className={`${s.block} ${flip ? s.flip : ""}`} data-store={st.id}>
              <div className={s.top}>
                <Link href={`/stores/${st.id}`} className={`tape ${s.plateLink}`} aria-label={`${st.course.n}차 ${st.shortName} 매장 정보`}>
                  <Piece name={plateOf(st.id)} rotate={flip ? 2 : -2} sizes="300px" priority={i === 0} className={s.plate} />
                </Link>
                {i === 0 && <Piece name="note-again" rotate={6} className={s.noteAgain} sizes="110px" />}
                {i === 1 && <Piece name="note-today" rotate={-5} className={s.noteToday} sizes="120px" />}
              </div>
              <h3 className="sr-only">{st.course.n}차 {st.name}</h3>

              <div className={s.fan}>
                {photos.map((p, k) => {
                  const alt = st.images.find((im) => im.src === p.src)?.alt ?? `${st.shortName} 사진`;
                  return (
                    <Link key={p.src} href={`/stores/${st.id}`} className={`pola ${s.pola} ${s[`p${k}`]}`} style={{ "--r": `${rot[k]}deg` } as CSSProperties}>
                      <Image src={p.src} alt={alt} width={320} height={320} sizes="180px" style={p.pos ? { objectPosition: p.pos } : undefined} />
                    </Link>
                  );
                })}
              </div>

              <div className={s.under}>
                <Piece name={benefitOf(st.id)} rotate={flip ? -2 : 1.5} sizes="240px" className={s.benefit} />
                {i === 0 ? <Piece name="mug" rotate={8} className={s.mug} sizes="72px" /> : <KitPiece name={CUT[st.id]} rotate={flip ? -8 : 8} className={s.mug} sizes="72px" />}
              </div>

              <div className={`paper ${flip ? "paper-r" : "paper-l"} ${s.info}`}>
                <p className={s.hoursRow}>
                  <span className={`chip ${today.open ? "chip-on" : "chip-off"} ${s.chip}`}>{today.state}</span>
                  {today.hours && <span className={`num ${s.hours}`}>{today.hours}</span>}
                </p>
                <p className={s.giftLine}>{giftLine(st, gifts[st.id] ?? [])}</p>
                {notice && <p className={s.notice}><b className={s.noticeDay}>공지</b>{notice}</p>}
              </div>

              <div className={s.cta}>
                {links ? (
                  <StickerButton kind="book" href={links.booking}>예약하기<span className="sr-only"> — {st.shortName}</span></StickerButton>
                ) : (
                  <Link className="btn" href={`/stores/${st.id}`}>매장 정보</Link>
                )}
                <Link href={`/stores/${st.id}`} className="link-d">사진·메뉴 더보기</Link>
              </div>
              {!next && <KitDivider name={`sign-${st.id}`} className={s.sign} />}
            </article>

            {next && <NextStop store={st} next={next} className={s.walk} rotate={flip ? 1 : -1} />}
          </div>
        );
      })}
    </section>
  );
}
