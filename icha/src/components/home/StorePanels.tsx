import Image from "next/image";
import Link from "next/link";
import { StoreSign } from "@/components/site/StoreSign";
import { openStatus } from "@/components/site/StoreHelpers";
import { NIGHT_PHOTO } from "@/components/site/storePhotos";
import { formatWon, type Rules } from "@/lib/config";
import { distanceM, walkMinutes } from "@/lib/geo";
import type { MenuItem } from "@/lib/db/queries";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./StorePanels.module.css";

/** "15:00 – 다음날 09:00" → "15:00~09:00", 휴무 → "오늘 쉬어요" */
function todayCompact(store: Store, now: Date): { text: string; open: boolean; rest: boolean } {
  const st = openStatus(store, now);
  if (st.today === "휴무") return { text: "오늘 쉬어요", open: false, rest: true };
  return { text: `오늘 ${st.today.replace(/\s*–\s*(다음날\s*)?/, "~")}`, open: st.open, rest: false };
}

/** 좁은 줄에 맞게 괄호 설명은 뺀 이름 */
function shortName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

/** 두 가게 사이 — "50m · 걸어서 1분" */
function walkLine(a: Store, b: Store): string {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return "50m 안 · 걸어서 1분";
  const m = Math.round(distanceM({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }));
  return `${m}M · 걸어서 ${walkMinutes(m)}분`;
}

/**
 * 1차 · 2차 · 3차 — 가게마다 사진 한 장(누르면 가게 화면), 그 위에 네온 간판,
 * 아래에 오늘 영업·혜택 한 줄과 초록 버튼 하나(예약하기). 버튼은 가게마다 하나뿐이다.
 */
export function StorePanels({ now, gifts, rules }: { now: Date; gifts: Record<string, MenuItem[]>; rules: Rules }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section className={s.list} aria-labelledby="stores-title">
      <h2 id="stores-title" className="sr-only">1차 · 2차 · 3차 참여 가게</h2>
      {ordered.map((st, i) => {
        const panel = NIGHT_PHOTO[st.id];
        const photoAlt = st.images.find((im) => im.src === panel.src)?.alt ?? `${st.shortName} 밤 외관`;
        const links = placeLinks(st);
        const notice = rules.storeNotices?.[st.id]?.trim();
        const today = todayCompact(st, now);
        const items = gifts[st.id] ?? [];
        const first = items[0];
        const next = ordered[i + 1];
        return (
          <article key={st.id} className={s.panel} data-store={st.id}>
            <Link href={`/stores/${st.id}`} className={`frame ${s.shot}`}>
              <Image src={panel.src} alt={photoAlt} fill sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: panel.pos }} className={s.img} />
              <span className={`vignette ${s.layer}`} aria-hidden="true" />
              <span className={`scrim ${s.layer}`} aria-hidden="true" />
              <span className={`grain ${s.layer}`} aria-hidden="true" />
              <span className={s.no} aria-hidden="true">
                <b className={s.noN}>{st.course.n}</b>
                <b className={s.noCha}>차</b>
              </span>
              <span className={s.noRule} aria-hidden="true" />
              <span className={s.signWrap}>
                <StoreSign id={st.id} className={s.sign} priority={st.course.n === 1} />
                <span className={s.drink}>{st.course.line}</span>
              </span>
              <h3 className="sr-only">{st.course.n}차 {st.name} — 가게 보기</h3>
            </Link>

            <div className={s.under}>
              <p className={s.line}>
                <b className={s.lineB}>{st.drink}</b>
                <span className={today.open ? s.open : s.closed}>{today.open ? "지금 영업 중" : today.rest ? "오늘 쉬어요" : "지금은 쉬어요"}</span>
                {!today.rest && <span className="num">{today.text}</span>}
              </p>
              {notice && <p className={s.notice}>오늘 · {notice}</p>}
              {first && (
                <>
                  <div className={`hair-store ${s.giftRule}`} aria-hidden="true" />
                  <p className={s.gift}>
                    <span className={s.giftName}>{items.map((m) => shortName(m.name)).join(" 또는 ")}</span>
                    {items.length === 1 && first.price != null && <s className="strike num">{formatWon(first.price)}</s>}
                    <span className={s.giftFree}>무료</span>
                  </p>
                </>
              )}
              <div className={s.cta}>
                {links ? (
                  <a className="btn btn-naver" href={links.booking} target="_blank" rel="noreferrer">예약하기<span className="sr-only"> — {st.shortName}</span></a>
                ) : (
                  <Link className="btn" href={`/stores/${st.id}`}>가게 보기</Link>
                )}
                <Link href={`/stores/${st.id}`} className={s.more}><span>{st.shortName} 사진·메뉴·오시는 길</span></Link>
              </div>
            </div>

            {next && <p className={s.walk}>{walkLine(st, next)} — 다음은 {next.course.n}차 {next.shortName}</p>}
          </article>
        );
      })}
    </section>
  );
}
