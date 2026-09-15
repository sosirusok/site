import Image from "next/image";
import Link from "next/link";
import { STORES, naverPlaceUrl, type Store } from "@/lib/stores";
import { ArrowIcon, ClockIcon, DrinkIcon, PinIcon } from "@/components/ui/icons";
import { hoursSummary } from "./StoreHours";
import styles from "./HomeStores.module.css";

function heroImage(s: Store) {
  return s.images.find((i) => i.kind === "hero") ?? s.images[0] ?? null;
}

export function HomeStores({ source = STORES }: { source?: Store[] }) {
  return (
    <ul className={styles.list}>
      {source.map((s, i) => {
        const img = heroImage(s);
        const naver = naverPlaceUrl(s);
        const hours = hoursSummary(s);
        const num = String(i + 1).padStart(2, "0");
        return (
          <li key={s.id} data-store={s.id} className={`rise ${styles.item}`}>
            <div className={styles.photo}>
              {img ? (
                <Image src={img.src} alt={img.alt} fill sizes="(min-width: 760px) 56vw, 100vw" className={styles.img} priority={i === 0} />
              ) : (
                <div className={styles.fallback}>
                  <DrinkIcon drink={s.drink} size={88} />
                  <span className={`mono ${styles.fallbackNote}`}>사진 준비 중</span>
                </div>
              )}
              <span className={`mono ${styles.badge}`} aria-hidden="true">{num}</span>
            </div>
            <div className={styles.body}>
              <p className={styles.eyebrow}>
                <span className={styles.drink}><DrinkIcon drink={s.drink} size={18} /> {s.drink}</span>
                <span className={`mono ${styles.full}`}>{s.name}</span>
              </p>
              <h3 className={`serif ${styles.name}`}>
                <span className={`mono ${styles.numInline}`} aria-hidden="true">{num}</span>
                {s.shortName}
              </h3>
              <p className={`serif ${styles.headline}`}>{s.headline}</p>
              <dl className={styles.facts}>
                <div className={styles.fact}>
                  <dt className={styles.factKey}><ClockIcon size={18} /><span className="sr-only">영업시간</span></dt>
                  <dd className={`mono ${styles.factVal}`}>{hours ?? "영업시간 확인 중"}</dd>
                </div>
                {s.address && (
                  <div className={styles.fact}>
                    <dt className={styles.factKey}><PinIcon size={18} /><span className="sr-only">주소</span></dt>
                    <dd className={styles.factVal}>{s.address}</dd>
                  </div>
                )}
              </dl>
              <div className={styles.actions}>
                <Link href={`/stores/${s.id}`} className="btn btn-store">
                  매장 자세히 <ArrowIcon size={18} />
                </Link>
                {naver && (
                  <a href={naver} target="_blank" rel="noreferrer" className={styles.naver}>네이버 플레이스 ↗</a>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
