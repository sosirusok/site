import { PlaceButton } from "@/components/site/PlaceButton";
import { BRAND } from "@/lib/config";
import { placeSheetStores } from "@/lib/place-stores";
import s from "./home.module.css";

/**
 * BRAND.ruleOneLiner(두 문장, 390px 에서 네 줄)를 카드 안 두 줄에 맞게 줄인 말.
 * 같은 사실: 계산할 때 번호 → 쿠폰, 50m 안 다른 매장에서 혜택. "메인안주 1개" 조건은 아래 BRAND.condition 이 맡는다.
 */
const RULE_TWO_LINES = "계산할 때 번호를 말하면 쿠폰이 와요. 50m 안 다른 매장에서 특별 혜택을 받아요.";

/** 포스터 아래 네온 카드 — 이벤트 이름, 코스, 규칙 두 줄, 조건, 플레이스 버튼 하나 */
export function EventCard() {
  return (
    <section className={`wrap ${s.event}`} aria-labelledby="event-title">
      <div className={`card-neon ${s.eventCard}`}>
        <p className="cap">{BRAND.name} · {BRAND.unionName}</p>
        <h1 id="event-title" className={`h1-event ${s.h1}`}>{BRAND.eventTag}</h1>
        <p className={s.course}>{BRAND.course}</p>
        <p className={s.rule}>{RULE_TWO_LINES}</p>
        <p className="cap">{BRAND.condition}</p>
        <PlaceButton stores={placeSheetStores()} className={`btn btn-naver btn-block ${s.eventBtn}`}>네이버 플레이스에서 보기</PlaceButton>
      </div>
    </section>
  );
}
