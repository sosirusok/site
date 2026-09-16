import type { Rules } from "@/lib/config";
import s from "./home.module.css";

/** 100000 → "10만원", 125000 → "12만 5,000원", 8000 → "8,000원" */
export function manwon(n: number): string {
  if (n < 10000) return `${n.toLocaleString("ko-KR")}원`;
  const man = Math.floor(n / 10000);
  const rest = n % 10000;
  return rest === 0 ? `${man}만원` : `${man}만 ${rest.toLocaleString("ko-KR")}원`;
}

/** 단골 등급 — 누적 기준 한 줄 */
export function Tier({ rules }: { rules: Rules }) {
  const line = rules.tiers.map((t) => `${manwon(t.minSpend)} ${t.name}`).join(" · ");
  return (
    <section className={`section ${s.tier}`} aria-labelledby="tier-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="tier-title" className="h2-event">단골 등급</h2>
        </div>
        <div className="card-soft">
          <p className={s.tierLine}>세 집 합쳐 누적<br />{line}</p>
          <p className="cap">등급이 오르면 쿠폰이 따로 들어와요.</p>
        </div>
      </div>
    </section>
  );
}
