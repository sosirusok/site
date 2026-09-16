import Link from "next/link";
import { Art } from "@/components/art/Art";
import type { MenuItem } from "@/lib/db/queries";
import { STORES } from "@/lib/stores";
import { formatWon } from "@/lib/config";
import styles from "./Gifts.module.css";

/** 무료 증정: 쿠폰 티켓 세 장을 가로로 넘겨 보고, 티켓 아래 품목 한 줄 */
export function Gifts({ gifts }: { gifts: Record<string, MenuItem[]> }) {
  return (
    <section id="gifts" className={`section ${styles.section}`} aria-labelledby="gifts-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-coupon" width={36} />
          <h2 id="gifts-title" className="h2">무료로 드리는 것</h2>
        </div>
        <ul className={styles.row}>
          {STORES.map((s) => (
            <li key={s.id} className={styles.item} data-store={s.id}>
              <Link href={`/stores/${s.id}`} className={styles.ticket}>
                <Art name={`coupon-${s.id}`} alt={`${s.shortName} ${s.drink} 무료 쿠폰`} sizes="(min-width: 760px) 260px, 78vw" />
              </Link>
              {(gifts[s.id] ?? []).map((m) => (
                <p key={m.id} className={styles.line}>
                  {m.name} {m.price != null && <>{formatWon(m.price)} → </>}<b>무료</b>
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
