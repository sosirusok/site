import { STORES } from "@/lib/stores";
import s from "./Ticker.module.css";

/** 흘러가는 이름 띠 — 1차·2차·3차 가게 이름이 각자 네온색으로 지나간다. 장식이라 스크린 리더에는 감춘다. */
export function Ticker() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const run = (
    <div className={s.run}>
      {ordered.map((st) => (
        <span key={st.id} className={s.item} data-store={st.id}>
          <span className={s.n}>{st.course.n}차</span>
          <span className="tube-store">{st.shortName}</span>
          <span className={s.sep}>／</span>
        </span>
      ))}
      <span className={s.note}>서면 50M 안</span>
      <span className={s.sep}>／</span>
    </div>
  );
  return (
    <div className={s.strip} aria-hidden="true">
      <div className={s.track}>
        {run}
        {run}
      </div>
    </div>
  );
}
