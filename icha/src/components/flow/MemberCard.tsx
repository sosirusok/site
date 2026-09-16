import Image from "next/image";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import type { Rules } from "@/lib/config";
import { formatWon, maskPhone } from "@/lib/config";
import { tierFor } from "@/lib/settings";
import styles from "./MemberCard.module.css";

/** vipcard-NN 프레임별로 남색이 왼쪽에서 차오른 비율(%). 글자를 어느 쪽에 어떤 색으로 얹을지 정한다. */
const NAVY_PCT = [0, 0, 13, 25, 39, 52, 63, 79, 99, 99, 99, 99, 99];

export type MemberCardProps = { phone: string; totalSpend: number; visitCount: number; rules: Rules };

/**
 * 회원 카드. 최고 두 등급이면 사장님 VIP 카드(남색) 위에 실제 값을 얹고,
 * 그 아래 등급이면 VIP 로 가는 진행에 맞는 프레임(vipcard-01..11) 위에 등급 이름과 누적 금액을 얹는다.
 */
export function MemberCard({ phone, totalSpend, visitCount, rules }: MemberCardProps) {
  const tiers = rules.tiers;
  const tier = tierFor(totalSpend, rules);
  const topKeys = tiers.slice(-2).map((t) => t.key);
  const isTop = topKeys.includes(tier.key);
  const vipMin = tiers[Math.max(0, tiers.length - 2)]?.minSpend ?? 1;
  const progress = Math.min(1, totalSpend / Math.max(1, vipMin));
  const frame = 1 + Math.min(10, Math.round(progress * 10));
  const navy = NAVY_PCT[frame] ?? 0;
  const side = navy >= 50 ? "left" : "right";
  const ink = navy >= 50 ? "light" : "dark";

  if (isTop) {
    return (
      <div className={styles.card} data-kind="vip">
        <Art name="vip-card" alt={`${tier.name} 회원 카드`} sizes="(min-width: 760px) 440px, 92vw" priority />
        <span className={`mono ${styles.vipNo}`} aria-label={`회원번호 ${maskPhone(phone)}`}>{maskPhone(phone)}</span>
        <span className={`mono ${styles.vipAmt}`} aria-label={`누적 결제금액 ${formatWon(totalSpend)}`}>{formatWon(totalSpend)}</span>
        {tier.key !== topKeys[0] && <span className={styles.vipTier}>{tier.name}</span>}
        <Link href="/#vip" className={styles.vipLink} aria-label="혜택 보기" />
      </div>
    );
  }

  return (
    <div className={styles.card} data-kind="frame">
      <Image src={`/art/vipcard-${String(frame).padStart(2, "0")}.png`} alt={`${tier.name} 회원 카드`} width={800} height={459} sizes="(min-width: 760px) 440px, 92vw" priority draggable={false} />
      <div className={styles.frameText} data-side={side} data-ink={ink}>
        <span className={styles.frameTier}>{tier.name}</span>
        <span className={`mono ${styles.frameAmt}`}>{formatWon(totalSpend)}</span>
        <span className={`mono ${styles.frameNo}`}>{maskPhone(phone)} · {visitCount}회</span>
      </div>
    </div>
  );
}
