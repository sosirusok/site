import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { BRAND, type Rules } from "@/lib/config";
import { ruleLine, STEP_LINES } from "@/lib/copy";
import s from "./home.module.css";

const STEP_SUB = ["사진 촬영이나 앱 설치 없이, 번호만 말씀하시면 됩니다.", "로그인은 그 휴대폰 번호로 합니다.", "세 매장 모두 서면역 6번 출구 근처, 서로 50m 이내입니다.", "쿠폰 화면을 직원에게 보여 주시면 됩니다."] as const;

/** 이용 방법 — 속 빈 거대 숫자(01~04) 옆에 한글 간판 글자 한 줄. 단계마다 형광색이 바뀐다(마젠타→시안→라임→마젠타) */
export function HowToSteps({ rules }: { rules: Rules }) {
  return (
    <Section id="howto" tone="cyan" eyebrow="How to" title="이렇게 받으세요" lead={BRAND.eventTag} pt={58} pb={40}>
      <ol className={s.steps}>
        {STEP_LINES.map((text, i) => (
          <li key={text} className={s.step} data-tone={["mag", "cyan", "lime", "mag"][i]}>
            <span className={`bignum ${s.stepNo}`} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div className={s.stepBody}>
              <p className={s.stepTitle}><span className="sr-only">{i + 1}단계. </span>{text}</p>
              <p className={s.stepSub}>{STEP_SUB[i]}</p>
            </div>
          </li>
        ))}
      </ol>
      <ul className={`notice ${s.rules}`} aria-label="이용 조건">
        <li>{BRAND.condition}</li>
        <li>{ruleLine(rules)}</li>
        <li>쿠폰 1장당 매장 1곳 · 발급 후 변경 불가</li>
      </ul>
      <Button href="/wallet" variant="primary" size="lg" block className={s.walletBtn}>쿠폰함 열기</Button>
    </Section>
  );
}
