import type { Store } from "@/lib/stores";
import styles from "./StoreHours.module.css";

/** 홈 카드용 한 줄 요약. 데이터가 없으면 null. */
export function hoursSummary(s: Store): string | null {
  if (!s.hours.length) return null;
  return s.hours
    .slice(0, 2)
    .map((h) => `${h.days} ${h.time}`)
    .join(" / ");
}

export function StoreHours({ store, naverUrl }: { store: Store; naverUrl: string | null }) {
  if (!store.hours.length) {
    return (
      <div className={styles.empty}>
        <p>영업시간은 아직 확인 중이에요.</p>
        {naverUrl && (
          <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스에서 확인 ↗</a>
        )}
      </div>
    );
  }
  return (
    <div className={styles.root}>
      <table className={styles.table}>
        <caption className="sr-only">{store.shortName} 영업시간</caption>
        <tbody>
          {store.hours.map((h, i) => (
            <tr key={i}>
              <th scope="row" className={styles.days}>{h.days}</th>
              <td className={`mono ${styles.time}`}>{h.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {store.hoursNote && <p className={styles.note}>{store.hoursNote}</p>}
    </div>
  );
}
