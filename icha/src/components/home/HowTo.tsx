import { Art } from "@/components/art/Art";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import type { Rules } from "@/lib/config";
import s from "./home.module.css";

/** 받는 순서 세 줄 + 규칙 한 줄 */
export function HowTo({ rules }: { rules: Rules }) {
  return (
    <section className="section" aria-labelledby="how-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="how-title" className="h2">이렇게 받아요</h2>
        </div>
        <ol>
          {STEP_LINES.map((line, i) => (
            <li key={line} className="row">
              <span className={s.icon} aria-hidden="true">
                <Art name={`how-${i + 1}`} width={48} />
              </span>
              <div className="body">
                <p className="title">{line}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className={`cap ${s.rule}`}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
