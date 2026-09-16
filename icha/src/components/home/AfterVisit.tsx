import type { Rules } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** 다녀온 뒤에 — 가게마다 네이버 리뷰로 가는 작은 글자 링크. 큰 초록 버튼은 예약하기 하나뿐이라 여기엔 두지 않는다. */
export function AfterVisit({ rules }: { rules: Rules }) {
  const rows = [...STORES]
    .sort((a, b) => a.course.n - b.course.n)
    .map((st) => ({ st, links: placeLinks(st) }))
    .filter((x): x is { st: (typeof STORES)[number]; links: NonNullable<ReturnType<typeof placeLinks>> } => x.links != null);
  if (rows.length === 0) return null;
  return (
    <section className={`wrap ${s.sec}`} aria-labelledby="review-title">
      <div className={s.head}>
        <p className={`kicker ${s.kick}`}>한 잔 끝나고</p>
        <h2 id="review-title" className={`tube ${s.title}`}>다녀온 뒤에</h2>
        <p className={s.lead}>리뷰 한 줄이 다음 손님을 부르고, 사장님이 웃어요.</p>
      </div>
      <ul className={s.reviews}>
        {rows.map(({ st, links }) => {
          const benefit = rules.reviewBenefit?.[st.id]?.trim();
          return (
            <li key={st.id} className={s.revRow} data-store={st.id}>
              <span className={`tube-store ${s.revName}`}>{st.shortName}</span>
              {benefit && <span className={s.revBenefit}>{benefit}</span>}
              <a className={s.revLink} href={links.review} target="_blank" rel="noreferrer">리뷰 쓰기</a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
