import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { KitPiece, StickerButton } from "@/components/site/Kit";
import { NextStop } from "@/components/site/NextStop";
import { benefitOf, Piece, plateOf } from "@/components/site/Poster";
import { nowText, openStatus } from "@/components/site/StoreHelpers";
import { capParts, FAN_PHOTOS, photoAlt } from "@/components/site/storePhotos";
import type { Rules, StoreId } from "@/lib/config";
import { giftLine } from "@/lib/copy";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./StoreBlocks.module.css";

/** 오늘 영업 — 상태 칩 문구(영업 중 / 영업 전 · 17:00 오픈 / 영업 종료 / 휴무)와 시간("15:00~09:00", 휴무면 "") */
function todayParts(store: Store, now: Date): { open: boolean; state: string; hours: string } {
  const st = openStatus(store, now);
  if (st.today === "휴무") return { open: false, state: "휴무", hours: "" };
  return { open: st.open, state: nowText(st), hours: st.today.replace(/\s*–\s*(다음날\s*)?/, "~") };
}

/** 혜택 상자 옆에 붙는 키트 컷아웃 — 1차 맥주잔(96px 높이), 2차 막걸리 주전자(96px 폭), 3차 소주병(96px 높이). 없으면 포스터 맥주잔(1차)만 */
const CUT: Record<StoreId, { name: string; cls: string }> = {
  tokyo: { name: "cut-beer", cls: "cutTall" },
  joseon: { name: "cut-makgeolli", cls: "cutWide" },
  wareureu: { name: "cut-soju", cls: "cutTall" },
};

/** 폴라로이드 세 장의 기울기 — [안주 큰 카드, 술 큰 카드, 입구 작은 카드]; 짝수 블록(2차)은 좌우가 바뀌므로 반대로 */
const FAN_R: readonly [number, number, number][] = [
  [-2, 2, 3],
  [2, -2, -3],
];

/**
 * 1차 · 2차 · 3차 — 매장마다 키트 간판(한 단 가득, 누르면 매장 화면), 폴라로이드 세 장(캡션 있음), 포켓(손글씨 메모 또는 컷아웃),
 * 혜택 상자 + 컷아웃, 정보 종이 한 장(영업 상태 칩 + 시간 / 혜택 한 줄 / 공지), 초록 [예약하기] 하나 + [사진·메뉴 더 보기].
 * 사진 격자(5칸): 큰 카드 3칸(60%) — 캡션 한 줄(최장 191px)이 들어가려면 사진 폭 195px 이상이라 이 폭. 작은 카드 2칸(40%)은 캡션이 짧은 매장 입구.
 *   1행: [안주 큰 카드][입구 작은 카드(30px 아래)]   2행: [포켓][술 큰 카드]   — 2차 블록은 좌우 반대(.flip)
 *   포켓: 1차 note-again, 2차 note-today(흰 손글씨라 획 그림자 + 가장자리 없는 어둠 .note-dark), 3차 cut-yogurt(요거트 아이스크림 96px 폭, −4도).
 * 간판 링크의 읽히는 이름 = 간판에 적힌 글자(img alt) + " 매장 정보". 예약하기는 왼쪽, 더 보기는 오른쪽 — 세 블록 같은 규칙.
 * 정보 글자는 전부 본문 글꼴로 종이 위에. 블록 사이는 다음 매장 종이 한 줄.
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
        const rot = FAN_R[flip ? 1 : 0]!;
        const today = todayParts(st, now);
        const cut = CUT[st.id];
        const pola = (k: number, cls: string | undefined, sizes: string) => {
          const p = photos[k]!;
          const [capName, capPrice] = capParts(p.cap);
          return (
            <Link href={`/stores/${st.id}`} className={`pola ${s.pola} ${cls}`} style={{ "--r": `${rot[k]}deg` } as CSSProperties}>
              <Image src={p.src} alt={photoAlt(st.images, p)} width={480} height={360} sizes={sizes} style={{ objectPosition: p.pos }} />
              <span className="cap">{capName}{capPrice && <> <span className="cap-price">{capPrice}</span></>}</span>
            </Link>
          );
        };
        return (
          <div key={st.id}>
            <article className={`${s.block} ${flip ? s.flip : ""}`} data-store={st.id}>
              <Link href={`/stores/${st.id}`} className={s.plateLink}>
                <Piece name={plateOf(st.id)} rotate={flip ? 1 : -1} sizes="(min-width: 480px) 448px, 100vw" priority={i === 0} className={s.plate} />
                <span className="sr-only"> 매장 정보</span>
              </Link>
              <h3 className="sr-only">{st.course.n}차 {st.name}</h3>

              <div className={s.fan}>
                {pola(0, s.pA, "220px")}
                {pola(2, s.pB, "140px")}
                <div className={s.pocket}>
                  {i === 0 && <KitPiece name="note-again" rotate={-5} sizes="136px" className={`note-dark ${s.noteBox}`} />}
                  {i === 1 && <KitPiece name="note-today" rotate={4} sizes="136px" className={`note-dark ${s.noteBox}`} />}
                  {i === 2 && <KitPiece name="cut-yogurt" bare sizes="96px" className={s.pocketCut} />}
                </div>
                {pola(1, s.pC, "220px")}
              </div>

              <div className={s.under}>
                <Piece name={benefitOf(st.id)} rotate={flip ? 1 : -1} sizes="300px" className={s.benefit} />
                {st.id === "tokyo" ? (
                  <Piece name="mug" bare className={`${s.cut} ${s[cut.cls]}`} sizes="80px" />
                ) : (
                  <KitPiece name={cut.name} bare className={`${s.cut} ${s[cut.cls]}`} sizes="100px" />
                )}
              </div>

              <div className={`paper ${flip ? "paper-r" : "paper-l"} ${s.info}`}>
                <p className={s.hoursRow}>
                  <span className={`chip ${today.open ? "chip-on" : "chip-off"} ${s.chip}`}>{today.state}</span>
                  {today.hours && <span className={`num ${s.hours}`}>{today.hours}</span>}
                </p>
                <p className={s.giftLine}>{giftLine(gifts[st.id] ?? [], st.benefitLabel)}</p>
                {notice && <p className={s.notice}><b className={s.noticeDay}>공지</b>{notice}</p>}
              </div>

              <div className={s.cta}>
                {links ? (
                  <StickerButton kind="book" href={links.booking} tilt={flip ? 1 : -1} suffix={` — ${st.shortName}`} className={s.book}>예약하기</StickerButton>
                ) : (
                  <Link className="btn" href={`/stores/${st.id}`}>매장 정보</Link>
                )}
                <StickerButton kind="details" size="sm" tilt={flip ? -1 : 1} secondary href={`/stores/${st.id}`} suffix={` — ${st.shortName}`} className={s.more}>사진·메뉴 더 보기</StickerButton>
              </div>
            </article>

            {next && <NextStop store={st} next={next} className={s.walk} rotate={flip ? 1 : -1} />}
          </div>
        );
      })}
    </section>
  );
}
