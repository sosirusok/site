import Image from "next/image";
import { Art } from "@/components/art/Art";
import { menuImageUrl, type MenuItem } from "@/lib/db/queries";
import { formatWon } from "@/lib/config";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

function Thumb({ item }: { item: MenuItem }) {
  if (item.hasImageData) return <Image src={menuImageUrl(item)} alt="" width={56} height={56} sizes="56px" className="thumb" unoptimized />;
  if (item.imagePath) return <Image src={item.imagePath} alt="" width={56} height={56} sizes="56px" className="thumb" />;
  return <Art name={`coupon-${item.storeId}`} className={`thumb ${s.ticket}`} sizes="56px" />;
}

/** 받을 수 있는 술 — 매장별 증정 품목을 목록 행으로 */
export function GiftList({ gifts }: { gifts: Record<string, MenuItem[]> }) {
  const rows = STORES.flatMap((st) => (gifts[st.id] ?? []).map((m) => ({ st, m })));
  if (rows.length === 0) return null;
  return (
    <section className="section" aria-labelledby="gifts-title">
      <div className="wrap">
      <div className="section-h">
        <h2 id="gifts-title" className="h2">받을 수 있는 술</h2>
      </div>
      <ul>
        {rows.map(({ st, m }) => (
          <li key={m.id} className="row">
            <Thumb item={m} />
            <div className="body">
              <p className="title">{m.name}</p>
              <p className="sub">{st.shortName}</p>
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
