import Image from "next/image";
import { menuImageUrl, type MenuItem } from "@/lib/db/queries";
import { formatWon } from "@/lib/config";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** 메뉴 실사진이 있으면 56px 사진, 없으면 썸네일 없이 글자만 (쿠폰 티켓 그림은 쿠폰 화면에서만) */
function Thumb({ item }: { item: MenuItem }) {
  if (item.hasImageData) return <Image src={menuImageUrl(item)} alt="" width={56} height={56} sizes="56px" className="thumb" unoptimized />;
  if (item.imagePath) return <Image src={item.imagePath} alt="" width={56} height={56} sizes="56px" className="thumb" />;
  return <span className="thumb" aria-hidden="true" />;
}

/** 매장별 특별 혜택 — 1차·2차·3차 순서로 증정 품목을 목록 행으로 */
export function GiftList({ gifts }: { gifts: Record<string, MenuItem[]> }) {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const rows = ordered.flatMap((st) => (gifts[st.id] ?? []).map((m) => ({ st, m })));
  if (rows.length === 0) return null;
  return (
    <section className="section" aria-labelledby="gifts-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="gifts-title" className="h2-event">매장별 특별 혜택</h2>
        </div>
        <ul>
          {rows.map(({ st, m }) => (
            <li key={m.id} className="row" data-store={st.id}>
              <Thumb item={m} />
              <div className="body">
                <p className="title">{m.name}</p>
                <p className="sub">{st.course.n}차 {st.shortName}</p>
              </div>
              <span className={s.price}>
                {m.price != null && <span className="strike">{formatWon(m.price)}</span>}
                <span className="tag tag-free">무료</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
