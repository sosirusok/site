import { Art } from "@/components/art/Art";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import type { Rules } from "@/lib/config";
import s from "./home.module.css";

/** 단계별 그림 — 그림은 세 장뿐이라 3단계(메인안주 주문)는 번호만 보여 준다 */
const STEP_ART: (string | null)[] = ["how-1", "how-2", null, "how-3"];

/** 받는 순서 네 줄 + 규칙 한 줄 */
export function HowTo({ rules }: { rules: Rules }) {
  return (
    <section className="section" aria-labelledby="how-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="how-title" className="h2-event">이렇게 받아요</h2>
        </div>
        <ol>
          {STEP_LINES.map((line, i) => {
            const artName = STEP_ART[i];
            return (
              <li key={line} className="row">
                <span className={`${s.slot} ${artName ? "" : s.slotEmpty}`} aria-hidden="true">
                  {artName && <Art name={artName} width={48} />}
                  <span className={s.step}>{i + 1}</span>
                </span>
                <div className="body">
                  <p className="title">{line}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className={`cap ${s.rule}`}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
