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

/** 참여 매장 — 행 전체가 매장 상세 링크 */
export function StoreList({ now }: { now: Date }) {
  return (
    <section className="section" aria-labelledby="stores-title">
      <div className="wrap">
      <div className="section-h">
        <h2 id="stores-title" className="h2">참여 매장</h2>
      </div>
      <ul>
        {STORES.map((st) => {
          const img = firstOfKind(st, "exterior") ?? heroImage(st);
          const loc = LOCATIONS[st.id];
          return (
            <li key={st.id} className="row" data-store={st.id}>
              <Link href={`/stores/${st.id}`} className={s.link}>
                {img && <Image src={img.src} alt="" width={56} height={56} sizes="56px" className="thumb" />}
                <div className="body">
                  <p className={`title ${s.title}`}>
                    {st.shortName}
                    <span className="dot" aria-hidden="true" />
                  </p>
                  <p className={`sub ${s.sub}`}>
                    {st.drink} · 걸어서 {loc.walkMin}분 · 오늘 {todayCompact(st, now)}
                  </p>
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
