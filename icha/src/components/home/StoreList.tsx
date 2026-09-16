import Image from "next/image";
import Link from "next/link";
import { Chevron } from "@/components/ui/Chevron";
import { firstOfKind, heroImage, openStatus } from "@/components/site/StoreHelpers";
import { LOCATIONS } from "@/lib/locations";
import { STORES, type Store } from "@/lib/stores";
import s from "./home.module.css";

/** "15:00 – 다음날 09:00" → "15:00~09:00", 휴무 → "쉬어요" */
function todayCompact(store: Store, now: Date): string {
  const st = openStatus(store, now);
  if (st.today === "휴무") return "쉬어요";
  return st.today.replace(/\s*–\s*(다음날\s*)?/, "~");
}

/** "맥주로 시작! · 맥주 · 걸어서 2분 · 오늘 17:00~03:00" — 토막 안에서는 줄이 안 바뀌고 " · " 뒤에서만 바뀐다 */
function subLine(store: Store, walkMin: number, now: Date): string {
  const nb = (t: string) => t.replace(/ /g, "\u00a0");
  return [store.course.line, `걸어서 ${walkMin}분`, `오늘 ${todayCompact(store, now)}`].map(nb).join("\u00a0· ");
}

/** 1차·2차·3차 — 포스터 코스 순서(맥주 → 막걸리 → 소주)로, 행 전체가 매장 상세 링크 */
export function StoreList({ now }: { now: Date }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <section className="section" aria-labelledby="stores-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="stores-title" className="h2-event">1차·2차·3차</h2>
        </div>
        <ul>
          {ordered.map((st) => {
            const img = firstOfKind(st, "exterior") ?? heroImage(st);
            const loc = LOCATIONS[st.id];
            return (
              <li key={st.id} className="row" data-store={st.id}>
                <Link href={`/stores/${st.id}`} className={s.link}>
                  {img && <Image src={img.src} alt="" width={56} height={56} sizes="56px" className="thumb" />}
                  <div className="body">
                    <p className={`title ${s.title}`}>
                      <span className="tag tag-store">{st.course.n}차</span>
                      {st.shortName}
                    </p>
                    <p className={`sub ${s.sub}`}>{subLine(st, loc.walkMin, now)}</p>
                  </div>
                  <Chevron />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
