import { BRAND } from "@/lib/config";
import s from "./home.module.css";

/** BRAND.ruleOneLiner 를 두 줄 안에 들어오게 줄인 말 — "메인안주 1개" 조건은 아래 .cap(BRAND.condition)이 맡는다 */
const RULE_SHORT = "한 매장 영수증을 올리면, 50m 안 다른 매장에서 특별 혜택을 받아요.";

/** 핵심 혜택 한 장 — 버튼은 화면 아래 고정 버튼(StickyCta)이 맡는다 */
export function Benefit() {
  return (
    <section className={`wrap ${s.benefit}`} aria-labelledby="benefit-title">
      <div className="card">
        <p className="cap">{BRAND.name} · {BRAND.unionName}</p>
        <h1 id="benefit-title" className={`h1-event ${s.h1}`}>{BRAND.eventTag}</h1>
        <p className={s.course}>{BRAND.course}</p>
        <p className={s.desc}>{RULE_SHORT}</p>
        <p className={`cap ${s.cond}`}>{BRAND.condition}</p>
      </div>
    </section>
  );
}
