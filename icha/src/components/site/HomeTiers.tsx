import { formatWon, type Rules } from "@/lib/config";
import styles from "./HomeTiers.module.css";

/** 등급 혜택 — 등급 / 기준 누적 결제 금액 / 혜택 표. 값은 운영 규칙에서. */
export function HomeTiers({ rules }: { rules: Rules }) {
  const tiers = rules.tiers;
  if (!tiers.length) return null;
  return (
    <div className={styles.root}>
      <table className={`table ${styles.table}`}>
        <thead>
          <tr>
            <th scope="col">등급</th>
            <th scope="col">기준 누적 결제 금액</th>
            <th scope="col">혜택</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.name}>일반</td>
            <td>전화번호 등록 시</td>
            <td>영수증 인증 시 무료 사이드 쿠폰 1장</td>
          </tr>
          {tiers.map((t, i) => (
            <tr key={t.key}>
              <td className={styles.name}>{t.name}</td>
              <td>{formatWon(t.minSpend)} 이상</td>
              <td>{i === tiers.length - 1 ? "등급별 추가 쿠폰 발급 대상 (최고 등급)" : "등급별 추가 쿠폰 발급 대상"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>누적 금액은 승인된 영수증의 결제 금액 합계입니다. 등급별 추가 쿠폰은 매장이 정한 시기에 쿠폰함으로 발급되며, 별도 신청은 필요 없습니다.</p>
    </div>
  );
}
