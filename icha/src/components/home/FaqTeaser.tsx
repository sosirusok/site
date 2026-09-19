import Link from "next/link";
import { Section } from "@/components/ui/Section";
import type { Rules } from "@/lib/config";
import { faqItems } from "@/lib/faq";
import s from "./home.module.css";

/**
 * 자주 묻는 질문 미리보기 — 앞 3개. 질문 앞에 Anton "Q01" 형광 마젠타, 여닫는 표시는 선 아이콘이 아니라 Anton 의 +/− 글자.
 * 이 섹션만 거대 숫자 머리를 쓰지 않는다(섹션 머리 모양이 다 같지 않게).
 */
export function FaqTeaser({ rules }: { rules: Rules }) {
  const items = faqItems(rules).slice(0, 3);
  return (
    <Section id="faq" head="slab" title="자주 묻는 질문" tone="lime" pt={44} pb={30} action={<Link href="/guide#faq" className="link">전체 보기 →</Link>}>
      <ul className={s.faq}>
        {items.map((it, i) => (
          <li key={it.id}>
            <details className={s.faqItem}>
              <summary className={s.faqQ}>
                <span className={s.faqNo} aria-hidden="true">Q{String(i + 1).padStart(2, "0")}</span>
                <span className={s.faqText}>{it.q}</span>
                <span className={s.faqToggle} aria-hidden="true" />
              </summary>
              <p className={s.faqA}>{it.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}
