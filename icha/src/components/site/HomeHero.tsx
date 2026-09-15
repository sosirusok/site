import Link from "next/link";
import { BRAND, formatWon, type Rules } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { ArrowIcon, DrinkIcon } from "@/components/ui/icons";
import { Stamp } from "@/components/ui/Stamp";
import styles from "./HomeHero.module.css";

function kstToday(): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function HomeHero({ rules }: { rules: Rules }) {
  const sampleStore = STORES[0];
  const giftStores = STORES.slice(1);
  const meta = [
    `결제 후 ${rules.receiptValidHours}시간 안에`,
    rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상` : null,
    `쿠폰은 ${rules.couponValidDays}일 동안`,
    `하루 ${rules.dailyLimitPerMember}장까지`,
  ].filter(Boolean);

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <span className={`serif ${styles.watermark}`} aria-hidden="true">{BRAND.hanja}</span>
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.spine} aria-hidden="true">
          {STORES.map((s) => (
            <span key={s.id} data-store={s.id} className={styles.band}>
              <DrinkIcon drink={s.drink} size={20} />
              <span className={`serif ${styles.bandName}`}>{s.shortName}</span>
              <span className={`mono ${styles.bandDrink}`}>{s.drink}</span>
            </span>
          ))}
        </div>

        <div className={styles.text}>
          <p className={`eyebrow rise ${styles.eyebrow}`}>
            {BRAND.unionName} · {STORES.map((s) => s.shortName).join(" × ")}
          </p>
          <h1 id="hero-title" className={`serif ${styles.title}`}>
            <span className={`${styles.line} rise`}>1차는 마음대로.</span>
            <span className={`${styles.line} rise rise-d1`}>2차는 <em className={styles.em}>한 접시</em></span>
            <span className={`${styles.line} rise rise-d2`}>얹어드립니다.</span>
          </h1>
          <p className={`lead rise rise-d2 ${styles.lead}`}>{BRAND.ruleOneLiner}</p>
          <div className={`rise rise-d3 ${styles.actions}`}>
            <Link href="/verify" className="btn btn-lg">
              영수증 인증하기 <ArrowIcon size={20} />
            </Link>
            <a href="#stores" className={`btn btn-lg btn-ghost ${styles.down}`}>
              세 매장 보기 <ArrowIcon size={20} className={styles.downIcon} />
            </a>
          </div>
          <p className={`mono rise rise-d4 ${styles.meta}`}>{meta.join(" · ")}</p>
        </div>

        {sampleStore && (
          <div className={`paper rise rise-d3 ${styles.sample}`} aria-label="영수증 인증 예시">
            <div className={styles.sampleHead}>
              <span className="serif">{BRAND.name} <span className={`mono ${styles.sampleHanja}`}>{BRAND.hanja}</span></span>
              <span className={`mono ${styles.sampleTag}`}>예시</span>
            </div>
            <hr className="dots" />
            <div className="row"><b>매장</b><span className="val">{sampleStore.shortName}</span></div>
            <div className="row"><b>일시</b><span className="val">{kstToday()} 21:40</span></div>
            <div className="row"><b>합계</b><span className="val">42,000원</span></div>
            <hr className="dots" />
            <p className={styles.sampleGift}>
              <span className="mono">→</span> {giftStores.map((s) => s.shortName).join(" 또는 ")}에서
              <br />
              <b>사이드 한 접시 무료</b>
            </p>
            <span className={styles.sampleStamp}>
              <Stamp text="승인" size={84} slam />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
