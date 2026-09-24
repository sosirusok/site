import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { BRAND, type Rules } from "@/lib/config";
import { ruleLine, STEP_LINES } from "@/lib/copy";
import s from "./home.module.css";

const STEP_SUB = ["앱도 사진도 필요 없습니다", "", "세 집 다 50m 안", ""] as const;

/**
 * 이용 방법 — 속 빈 거대 숫자(01~04) 옆에 한글 한 줄.
 * 단계 색을 배열 인덱스로 돌리지 않는다(mag→cyan→lime→mag 는 4단계에서 1단계 색으로 되감긴다).
 * 형광 3색은 매장을 가르는 데만 쓰고, 여기서는 라임 하나로 통일한다.
 * 보조 설명은 1·3단계에만 — 네 줄을 같은 길이·같은 어미로 채우면 그게 채움말이다.
 */
/**
 * compact 이면 홈용 — 네 단계를 가로 한 줄로 흘리고 설명은 뺀다.
 * 같은 블록을 홈과 안내에 통째로 두 번 쓰면, 안내 탭을 누른 손님이 방금 본 화면을 또 본다.
 */
export function HowToSteps({ rules, compact = false }: { rules: Rules; compact?: boolean }) {
  if (compact) {
    return (
      <Section id="howto" tone="cyan" title="혜택은 이렇게 받습니다" lead="앱 설치도, 영수증 사진도 필요 없습니다." pt={96} pb={104} className={s.howtoSection}>
        <ol className={s.flow}>
          {STEP_LINES.map((text, i) => (
            <li key={text} className={s.flowStep}>
              <span className={s.flowNo} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <p className={s.flowText}><span className="sr-only">{i + 1}단계. </span>{text}</p>
            </li>
          ))}
        </ol>
        <div className={s.flowFoot}>
          <p>{ruleLine(rules)}</p>
          <Button href="/guide" variant="ghost" className={s.walletBtn}>이용 조건 전체 보기 <span aria-hidden="true">→</span></Button>
        </div>
      </Section>
    );
  }
  return (
    <Section id="howto" tone="cyan" title="이렇게 받으세요" lead={BRAND.eventTag} pt={58} pb={40}>
      <ol className={s.steps}>
        {STEP_LINES.map((text, i) => (
          <li key={text} className={s.step}>
            <span className={`bignum ${s.stepNo}`} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div className={s.stepBody}>
              <p className={s.stepTitle}><span className="sr-only">{i + 1}단계. </span>{text}</p>
              {STEP_SUB[i] && <p className={s.stepSub}>{STEP_SUB[i]}</p>}
            </div>
          </li>
        ))}
      </ol>
      <Button href="/wallet" variant="primary" size="lg" block className={s.walletBtn}>쿠폰함 열기 →</Button>
    </Section>
  );
}
