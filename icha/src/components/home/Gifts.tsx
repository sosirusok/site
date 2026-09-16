import Image from "next/image";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import type { MenuItem } from "@/lib/db/queries";
import { menuImageUrl } from "@/lib/menu-image";
import { STORES } from "@/lib/stores";
import { formatWon } from "@/lib/config";
import styles from "./Gifts.module.css";

/** 무료 증정: 쿠폰 그림 + 점선 이음줄 메뉴판 */
export function Gifts({ gifts }: { gifts: Record<string, MenuItem[]> }) {
  return (
    <section id="gifts" className={`section ${styles.section}`} aria-labelledby="gifts-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-coupon" width={42} />
          <h2 id="gifts-title" className="h2">무료로 드리는 것</h2>
        </div>
        <p className={styles.intro}>
          영수증을 올린 집이 아닌 나머지 두 집에서 받을 수 있어요. 쿠폰 한 장에 한 잔이고, 현금으로 바꿔 드리지는 않아요.
        </p>
        <ul className={styles.list}>
          {STORES.map((s) => {
            const items = gifts[s.id] ?? [];
            return (
              <li key={s.id} className={styles.store} data-store={s.id}>
                <Link href={`/stores/${s.id}`} className={styles.ticket}>
                  <Art name={`coupon-${s.id}`} alt={`${s.shortName} ${s.drink} 무료 쿠폰`} sizes="(min-width: 760px) 340px, 88vw" />
                </Link>
                <ul className={styles.menu}>
                  {items.length === 0 && <li className={styles.empty}>증정 품목을 매장에서 정하고 있어요.</li>}
                  {items.map((m) => (
                    <li key={m.id} className={styles.row}>
                      {(m.imagePath || m.hasImageData) && (
                        <Image src={m.imagePath ?? menuImageUrl(m)} alt="" width={56} height={56} className={styles.thumb} />
                      )}
                      <span className={styles.rowName}>{m.name}</span>
                      <span className={styles.dots} aria-hidden="true" />
                      <span className={styles.price}>
                        {m.price != null && <s>{formatWon(m.price)}</s>} <b>무료</b>
                      </span>
                      {m.description && <span className={styles.desc}>{m.description}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
