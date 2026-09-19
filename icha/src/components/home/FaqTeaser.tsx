import Link from "next/link";
import { Section } from "@/components/ui/Section";
import type { Rules } from "@/lib/config";
import { faqItems } from "@/lib/faq";
import s from "./home.module.css";

/** 자주 묻는 질문 미리보기 — 앞 3개를 여닫는 줄로, 오른쪽 위에 전체 보기 링크 */
export function FaqTeaser({ rules }: { rules: Rules }) {
  const items = faqItems(rules).slice(0, 3);
  return (
    <Section id="faq" eyebrow="FAQ" title="자주 묻는 질문" action={<Link href="/guide#faq" className="link">전체 보기</Link>}>
      <ul className={s.faq}>
        {items.map((it) => (
          <li key={it.id}>
            <details className={s.faqItem}>
              <summary className={s.faqQ}>
                <span>{it.q}</span>
                <svg className={s.faqIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
              </summary>
              <p className={s.faqA}>{it.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}
