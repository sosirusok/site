import Image from "next/image";
import { formatWon, type Rules } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { Stamp } from "@/components/ui/Stamp";
import { firstOfKind, kstNow } from "./StoreHelpers";
import styles from "./HomeSteps.module.css";

/** 이렇게 받아요 — 01 계산한다 · 02 영수증을 찍는다 · 03 옆집에서 한 접시 받는다. 단계마다 실사진. */
export function HomeSteps({ rules }: { rules: Rules }) {
  const s1 = STORES[0], s2 = STORES[1], s3 = STORES[2];
  const interior = (s3 && firstOfKind(s3, "interior", 1)) ?? (s1 && firstOfKind(s1, "interior")) ?? null;
  const food = (s2 && firstOfKind(s2, "food", 1)) ?? (s1 && firstOfKind(s1, "food")) ?? null;
  const k = kstNow();
  const stampDate = `${String(k.date.getUTCMonth() + 1).padStart(2, "0")}.${String(k.date.getUTCDate()).padStart(2, "0")}`;
  const minAmount = rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상 결제하면 돼요.` : "금액은 상관없어요.";

  return (
    <ol className={styles.list}>
      <li className={`${styles.step} rise`}>
        <div className={styles.media}>
          {interior && <Image src={interior.src} alt={interior.alt} fill sizes="(min-width: 760px) 50vw, 100vw" className={styles.img} />}
        </div>
        <div className={styles.text}>
          <span className={styles.num} aria-hidden="true">01</span>
          <h3 className={`h2 ${styles.title}`}>세 곳 중 한 곳에서<br />1차를 <em>계산</em>해요</h3>
          <p className={styles.desc}>{STORES.map((s) => s.shortName).join(", ")} 어디든 좋아요. {minAmount} 카드·현금 모두 돼요.</p>
        </div>
      </li>

      <li className={`${styles.step} rise`}>
        <div className={`${styles.media} ${styles.paperMedia}`}>
          <div className={`paper paper-shadow ${styles.paper}`} aria-hidden="true">
            <p className={styles.paperHead}>{s1?.shortName ?? "매장"} 서면본점</p>
            <p className={styles.paperSub}>부산 부산진구 · 카드 승인</p>
            <hr className="dots" />
            <div className="row"><b>일시</b><span className="val">{stampDate} 21:42</span></div>
            <div className="row"><b>합계</b><span className="val">42,000원</span></div>
            <div className="row"><b>승인번호</b><span className="val">3071****</span></div>
            <hr className="dots" />
            <p className={styles.paperGift}>→ {s2?.shortName} · {s3?.shortName}에서<br /><b>사이드 한 접시 무료</b></p>
            <span className={styles.stamp}><Stamp text="승인" size={88} /></span>
          </div>
        </div>
        <div className={styles.text}>
          <span className={styles.num} aria-hidden="true">02</span>
          <h3 className={`h2 ${styles.title}`}>영수증을 <em>찍어</em><br />올려요</h3>
          <p className={styles.desc}>
            전화번호만 넣으면 끝, 회원 가입도 인증번호도 없어요. 결제 후 <b>{rules.receiptValidHours}시간 안</b>에 올려 주세요.
            하루 {rules.dailyLimitPerMember}장까지 돼요.
          </p>
        </div>
      </li>

      <li className={`${styles.step} rise`}>
        <div className={styles.media}>
          {food && <Image src={food.src} alt={food.alt} fill sizes="(min-width: 760px) 50vw, 100vw" className={styles.img} />}
        </div>
        <div className={styles.text}>
          <span className={styles.num} aria-hidden="true">03</span>
          <h3 className={`h2 ${styles.title}`}>나머지 두 곳 중<br />한 곳에서 <em>한 접시</em></h3>
          <p className={styles.desc}>
            승인되면 바로 사이드 메뉴를 골라요. 쿠폰은 {rules.couponValidDays}일 동안 유효하고, 직원 앞에서 '사용'을 누르면 끝이에요.
            영수증을 받은 매장에서는 혜택이 없어요.
          </p>
        </div>
      </li>
    </ol>
  );
}
