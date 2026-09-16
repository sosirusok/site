import Image from "next/image";
import Link from "next/link";
import { heroImage, openStatus } from "@/components/site/StoreHelpers";
import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import { STORES, type Store } from "@/lib/stores";
import s from "./home.module.css";

/** "15:00 – 다음날 09:00" → "15:00~09:00", 휴무 → "쉬어요" */
function todayCompact(store: Store, now: Date): string {
  const st = openStatus(store, now);
  if (st.today === "휴무") return "쉬어요";
  return st.today.replace(/\s*–\s*(다음날\s*)?/, "~");
}

/** 1차 · 2차 · 3차 — 매장마다 매장색 네온 카드: 실사진, 이름, N차, 한 줄, 버튼 둘(플레이스 / 가게 보기) */
export function StoreCards({ now }: { now: Date }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section className={`section ${s.sec}`} aria-labelledby="stores-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="stores-title" className="h2-event">1차 · 2차 · 3차</h2>
        </div>
        <ul className={s.cards}>
          {ordered.map((st) => {
            const img = heroImage(st);
            const loc = LOCATIONS[st.id];
            const links = placeLinks(st);
            return (
              <li key={st.id} className={`card-neon ${s.card}`} data-store={st.id}>
                {img && (
                  <div className={s.photo}>
                    <Image src={img.src} alt={img.alt} fill sizes="(min-width: 480px) 440px, 92vw" className={s.photoImg} />
                  </div>
                )}
                <h3 className={s.name}>
                  <span className="h2-event neon">{st.shortName}</span>
                  <span className="tag tag-neon">{st.course.n}차</span>
                  <span className={s.courseLine}>{st.course.line}</span>
                </h3>
                <p className={`cap ${s.meta}`}>{st.drink} · 걸어서 {loc.walkMin}분 · 오늘 {todayCompact(st, now)}</p>
                <div className={s.btns}>
                  {links ? (
                    <a className="btn btn-naver btn-sm" href={links.home} target="_blank" rel="noreferrer">플레이스</a>
                  ) : (
                    <span className={`btn btn-naver btn-sm ${s.btnOff}`} aria-hidden="true">플레이스</span>
                  )}
                  <Link className="btn btn-secondary btn-sm" href={`/stores/${st.id}`}>가게 보기</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
