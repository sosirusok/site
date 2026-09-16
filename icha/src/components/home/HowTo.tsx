import { STEP_LINES, ruleLine } from "@/lib/copy";
import type { Rules } from "@/lib/config";
import s from "./home.module.css";

/** 이렇게 받아요 — 번호 원 + 순서 네 줄, 아래에 규칙·조건 한 줄 */
export function HowTo({ rules }: { rules: Rules }) {
  return (
    <section className={`section ${s.sec}`} aria-labelledby="how-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="how-title" className="h2-event">이렇게 받아요</h2>
        </div>
        <ol>
          {STEP_LINES.map((line, i) => (
            <li key={line} className={`row ${s.stepRow}`}>
              <span className={`num ${s.step}`} aria-hidden="true">{i + 1}</span>
              <div className="body">
                <p className="title"><span className="sr-only">{i + 1}. </span>{line}</p>
              </div>
            </li>
          ))}
        </ol>
        {/* 조건(BRAND.condition)은 맨 위 이벤트 카드에 이미 있다 — 여기서는 장수·기간만 */}
        <p className={`cap ${s.ruleCap}`}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
