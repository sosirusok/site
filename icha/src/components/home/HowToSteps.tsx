import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { BRAND, type Rules } from "@/lib/config";
import { ruleLine, STEP_LINES } from "@/lib/copy";
import s from "./home.module.css";
import home from "./lower-home.module.css";

const STEP_SUB = ["앱도 사진도 필요 없습니다", "", "세 집 다 50m 안", ""] as const;

/** 홈은 간결한 안내로, /guide는 기존의 상세 단계로 보여 준다. */
export function HowToSteps({ rules, compact = false }: { rules: Rules; compact?: boolean }) {
  if (compact) {
    return (
      <section id="howto" className={home.howto} aria-labelledby="howto-title">
        <div className={home.utilityHeading}>
          <h2 id="howto-title">쿠폰 이용 안내</h2>
          <Link href="/guide">자세한 안내 <span aria-hidden="true">↗</span></Link>
        </div>
        <ol className={home.howSteps}>
          {STEP_LINES.map((text, index) => (
            <li key={text} className={home.howStep}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className={home.howBottom}>
          <p className={home.howCondition}>{ruleLine(rules)} · {BRAND.condition}</p>
          <Link href="/wallet" className={home.utilityAction}>내 쿠폰함 <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
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
