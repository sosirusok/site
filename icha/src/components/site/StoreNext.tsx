import Image from "next/image";
import Link from "next/link";
import { STORES, type Store } from "@/lib/stores";
import { heroImage, openStatus } from "./StoreHelpers";
import styles from "./StoreNext.module.css";

/** 이 매장 영수증이면, 사이드는 여기서 — 나머지 두 매장 사진 카드 + 인증 버튼 */
export function StoreNext({ store, others }: { store: Store; others: Store[] }) {
  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {others.map((s, i) => {
          const img = heroImage(s);
          const num = String(STORES.findIndex((x) => x.id === s.id) + 1).padStart(2, "0");
          return (
            <li key={s.id} className={`rise rise-d${i + 1}`}>
              <Link href={`/stores/${s.id}`} className={styles.card}>
                {img && <Image src={img.src} alt={img.alt} fill sizes="(min-width: 760px) 50vw, 100vw" className={styles.img} />}
                <span className={styles.shade} aria-hidden="true" />
                <span className={styles.text}>
                  <span className={styles.num}>{num}</span>
                  <span className={styles.name}>{s.shortName}</span>
                  <span className={styles.meta}>{s.drink} · 오늘 {openStatus(s).today}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={`rise rise-d3 ${styles.cta}`}>
        <Link href={`/verify?from=${store.id}`} className="btn btn-lg">{store.shortName} 영수증 인증하기</Link>
        <Link href="/guide" className={styles.guide}>이용 방법·유의사항</Link>
      </div>
    </div>
  );
}
