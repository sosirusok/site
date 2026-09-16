import Image from "next/image";
import Link from "next/link";
import { heroImage, openStatus } from "@/components/site/StoreHelpers";
import { formatWon, type Rules } from "@/lib/config";
import { menuImageUrl, type MenuItem } from "@/lib/db/queries";
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

/** 증정 메뉴 사진 40px (DB 사진 → /public 사진 → 없으면 자리만) */
function GiftThumb({ item }: { item: MenuItem }) {
  if (item.hasImageData) return <Image src={menuImageUrl(item)} alt="" width={40} height={40} sizes="40px" className={s.giftThumb} unoptimized />;
  if (item.imagePath) return <Image src={item.imagePath} alt="" width={40} height={40} sizes="40px" className={s.giftThumb} />;
  return null;
}

/** 카드 한 줄로 보여 주는 이 매장의 쿠폰 혜택 — 값은 DB(listMenu giftOnly) */
function GiftRow({ items }: { items: MenuItem[] }) {
  const first = items[0];
  if (!first) return null;
  const names = items.map((m) => m.name).join(" 또는 ");
  const price = items.length === 1 ? first.price : null;
  return (
    <p className={s.gift}>
      <GiftThumb item={first} />
      <span className={s.giftName}>쿠폰 혜택 · {names}</span>
      {price != null && <span className="strike num">{formatWon(price)}</span>}
      <span className="tag tag-free">무료</span>
    </p>
  );
}

/** 1차 · 2차 · 3차 — 매장색 네온 카드: 사진·이름·오늘, 오늘 소식, 쿠폰 혜택, 예약하기·플레이스 */
export function StoreCards({ now, gifts, rules }: { now: Date; gifts: Record<string, MenuItem[]>; rules: Rules }) {
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
            const notice = rules.storeNotices?.[st.id];
            return (
              <li key={st.id} className={`card-neon ${s.card}`} data-store={st.id}>
                <div className={s.head}>
                  {img && (
                    <Link href={`/stores/${st.id}`} className={s.photo} aria-label={`${st.shortName} 가게 보기`}>
                      <Image src={img.src} alt={img.alt} fill sizes="140px" className={s.photoImg} />
                    </Link>
                  )}
                  <div className={s.info}>
                    <h3 className={s.name}>
                      <Link href={`/stores/${st.id}`} className="h2-event neon">{st.shortName}</Link>
                      <span className="tag tag-neon">{st.course.n}차</span>
                    </h3>
                    <p className={s.courseLine}>{st.course.line}</p>
                    <p className="cap">{st.drink} · 걸어서 {loc.walkMin}분 · 오늘 {todayCompact(st, now)}</p>
                  </div>
                </div>
                {notice && <p className={s.notice}>오늘 · {notice}</p>}
                <GiftRow items={gifts[st.id] ?? []} />
                <div className={s.btns}>
                  {links ? (
                    <>
                      <a className="btn btn-naver btn-sm" href={links.booking} target="_blank" rel="noreferrer">예약하기</a>
                      <a className="btn btn-secondary btn-sm" href={links.home} target="_blank" rel="noreferrer">플레이스</a>
                    </>
                  ) : (
                    <Link className="btn btn-secondary btn-sm" href={`/stores/${st.id}`}>가게 보기</Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
