import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { KitPiece, StickerButton } from "@/components/site/Kit";
import { NextStop } from "@/components/site/NextStop";
import { benefitOf, Piece, plateOf } from "@/components/site/Poster";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import { capParts, FAN_PHOTOS, photoAlt } from "@/components/site/storePhotos";
import type { Rules, StoreId } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./StoreBlocks.module.css";

/** 오늘 영업 — 상태 문구(영업 중 / 영업 전 · 17:00 오픈 / 영업 종료 / 휴무)와 시간("17:00~03:00", 휴무면 "") */
export function todayParts(store: Store, now: Date): { open: boolean; state: string; hours: string } {
  const st = openStatus(store, now);
  if (st.today === "휴무") return { open: false, state: "휴무", hours: "" };
  return { open: st.open, state: nowText(st), hours: st.today.replace(/\s*–\s*(다음날\s*)?/, "~") };
}

/**
 * 콜아웃 "다른 매장 쿠폰 제시 시 {품목} 무료" — 두 줄: 앞말 / 품목(들) 무료. 품목 안의 띄어쓰기는 NBSP 라 "소주 1병" 이 갈라지지 않는다.
 * 품목은 DB 혜택 이름들("또는"으로 잇는다), 없으면 포스터의 혜택 이름.
 */
export function calloutLines(names: string[], fallback: string): [string, string] {
  const nb = (t: string) => t.trim().replace(/ /g, " ");
  const what = (names.length ? names : [fallback]).map(nb).join(" 또는 ");
  return ["다른 매장 쿠폰 제시 시", `${what} 무료`];
}

/** 장면마다 다른 조각 — 컷아웃(간판 오른쪽 끝을 뚫고 나오는 그 집 술), 사진 모서리의 메모, 3차의 둘째 컷아웃(요거트) */
const SCENE: Record<StoreId, { cut: string; cutCls: string; note: string; noteCls: string; noteDark: boolean; noteRot: number; extra?: string }> = {
  tokyo: { cut: "cut-beer", cutCls: "cutTall", note: "note-again", noteCls: "noteTR", noteDark: true, noteRot: 6 },
  joseon: { cut: "cut-makgeolli", cutCls: "cutWide", note: "note-today", noteCls: "noteTL", noteDark: true, noteRot: -6 },
  wareureu: { cut: "cut-soju", cutCls: "cutTall", note: "note-good", noteCls: "noteGood", noteDark: false, noteRot: -5, extra: "cut-yogurt" },
};

/**
 * 1차 · 2차 · 3차 — 매장마다 포스터 한 장면(390 화면 기준, 모든 좌표는 --u 로 화면 폭에 비례):
 *   z0 대표 안주 사진 390x260 (아래로 흐려짐) → z3 간판 358x149 top 200 (−2°, 왼쪽 위 테이프) → z4 컷아웃 top 140 오른쪽(6°, 간판 오른쪽 끝을 뚫는다)
 *   → z1 폴라로이드 168 top 318 오른쪽(3°, 위는 간판 밑, 왼쪽은 혜택 상자 밑; 캡션 457~491 드러남)
 *   → z2 혜택 상자 300x90 (−1.5°) 간판 밑으로 들어간다: 1차 top 323 · 2차 346 · 3차 332 (판 그림자가 상자 위 가장자리만 덮는다) + z4 무료 도장 56 (−12°)이 상자 오른쪽 위 모서리와 간판 아래 가장자리에 같이 찍힌다
 *   → z3 콜아웃(노란 Do Hyeon 18px 외곽선, −3°) top 432, 칸 66px → z4 검은 띠(영업 상태 · 시간) top 503 → 예약하기 top 543 왼쪽(−2°) · 사진·메뉴 더 보기 top 549 오른쪽(2°)
 *   사진 모서리에 메모 스티커 하나(1차 note-again, 2차 note-today, 3차 note-good). 장면 사이는 검은 띠(다음 매장).
 * 콜아웃·띠·버튼은 흐름(padding-top 432u)에 있어 콜아웃이 세 줄을 넘으면 아래가 그만큼 밀린다(겹치지 않는다).
 */
export function StoreBlocks({ now, rules, gifts }: { now: Date; rules: Rules; gifts: Record<StoreId, string[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section className={s.list} aria-labelledby="stores-title">
      <h2 id="stores-title" className="sr-only">참여 매장</h2>
      {ordered.map((st, i) => {
        const links = placeLinks(st);
        const notice = rules.storeNotices?.[st.id]?.trim();
        const photos = FAN_PHOTOS[st.id];
        const hero = photos[0]!;
        const second = photos[1]!;
        const [capName, capPrice] = capParts(second.cap);
        const next = ordered[i + 1];
        const today = todayParts(st, now);
        const sc = SCENE[st.id];
        const [line1, line2] = calloutLines(gifts[st.id] ?? [], st.benefitLabel);
        return (
          <div key={st.id}>
            <article className={s.scene} data-store={st.id} aria-labelledby={`store-${st.id}`}>
              {/* z0 — 대표 안주 사진, 화면 폭 가득 */}
              <div className={s.photo} aria-hidden="true">
                <Image src={hero.src} alt="" fill priority={i === 0} sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: hero.pos }} className={s.photoImg} />
              </div>

              {/* 사진 모서리 메모 스티커 */}
              <div className={`${s.noteSlot} ${s[sc.noteCls]}`}>
                <KitPiece name={sc.note} rotate={sc.noteRot} sizes="150px" className={`${s.note} ${sc.noteDark ? "note-dark" : ""}`} />
              </div>

              {/* z3 — 간판(누르면 매장 화면), 왼쪽 위 테이프 */}
              <Link href={`/stores/${st.id}`} className={s.plateLink} id={`store-${st.id}`}>
                <Piece name={plateOf(st.id)} rotate={-2} sizes="(min-width: 480px) 448px, 100vw" priority={i === 0} className={`tape-tl ${s.plate}`} />
                <span className="sr-only"> 매장 정보</span>
              </Link>

              {/* z4 — 간판 오른쪽 끝을 뚫고 나오는 컷아웃 */}
              <KitPiece name={sc.cut} bare sizes="140px" className={`${s.cut} ${s[sc.cutCls]}`} />

              {/* z1 — 둘째 사진 폴라로이드(위는 간판 밑, 왼쪽은 혜택 상자 밑) */}
              <Link href={`/stores/${st.id}`} className={`pola tape ${s.pola}`}>
                <Image src={second.src} alt={photoAlt(st.images, second)} width={480} height={392} sizes="190px" style={{ objectPosition: second.pos }} />
                <span className="cap">{capName}{capPrice && <> <span className="cap-price">{capPrice}</span></>}</span>
              </Link>

              {/* z2 — 혜택 상자(간판 밑으로) + z4 무료 도장(상자 모서리·간판 가장자리) (+ 3차는 왼쪽 위에 요거트) */}
              <Piece name={benefitOf(st.id)} rotate={-1.5} sizes="330px" className={s.benefit} />
              <KitPiece name="stamp-free" bare sizes="64px" className={s.stamp} />
              {sc.extra && <KitPiece name={sc.extra} bare sizes="80px" className={s.extra} />}

              {/* 흐름 — 콜아웃 → 검은 띠 → 스티커 둘 */}
              <p className={`callout ${s.callout}`}>{line1}<br />{line2}</p>
              <p className={`band ${s.band}`}>
                <span className={today.open ? "y" : ""}>{today.state}</span>
                {today.hours && <span className={s.bandHours}>· {today.hours}</span>}
                {notice && <span className={`c ${s.bandNotice}`}>· {notice}</span>}
              </p>
              <div className={s.cta}>
                {links ? (
                  <StickerButton kind="book" href={links.booking} tilt={-1} suffix={` — ${st.shortName}`} className={s.book} style={{ "--r": "-2deg" } as CSSProperties}>예약하기</StickerButton>
                ) : (
                  <Link className="btn" href={`/stores/${st.id}`}>매장 정보</Link>
                )}
                <StickerButton kind="details" size="sm" tilt={1} secondary href={`/stores/${st.id}`} suffix={` — ${st.shortName}`} className={s.more} style={{ "--r": "2deg" } as CSSProperties}>사진·메뉴 더 보기</StickerButton>
              </div>
            </article>

            {next && <NextStop store={st} next={next} />}
          </div>
        );
      })}
    </section>
  );
}
