import Image from "next/image";
import { STEP_LINES, ruleLine } from "@/lib/copy";
import type { Rules } from "@/lib/config";
import s from "./home.module.css";

/** 이렇게 받아요 — 어두운 가게 안 사진 위에 번호 네 줄. 상자 없이 가는 선으로만 나눈다. */
export function HowTo({ rules }: { rules: Rules }) {
  return (
    <section className={`frame ${s.how}`} aria-labelledby="how-title">
      <Image src="/images/stores/tokyo/interior-counter.jpg" alt="" aria-hidden="true" fill sizes="(min-width: 480px) 480px, 100vw" className={s.howBg} />
      <span className={`vignette ${s.howLayer}`} aria-hidden="true" />
      <span className={`grain ${s.howLayer}`} aria-hidden="true" />
      <div className={`wrap ${s.howBody}`}>
        <div className={s.head}>
          <p className={`kicker ${s.kick}`}>영수증 릴레이</p>
          <h2 id="how-title" className={`tube ${s.title}`}>이렇게 받아요</h2>
        </div>
        <ol className={s.steps}>
          {STEP_LINES.map((line, i) => (
            <li key={line} className={s.step}>
              <span className={s.stepN} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <p className={s.stepT}><span className="sr-only">{i + 1}. </span>{line}</p>
            </li>
          ))}
        </ol>
        <p className={s.ruleCap}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
