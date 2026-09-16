import type { Rules } from "@/lib/config";
import { placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** 다녀온 뒤에 — 매장마다 네이버 리뷰 쓰러 가는 줄. 매장이 적어 둔 리뷰 혜택(rules.reviewBenefit)이 있으면 같이 보여 준다. */
export function AfterVisit({ rules }: { rules: Rules }) {
  const rows = [...STORES]
    .sort((a, b) => a.course.n - b.course.n)
    .map((st) => ({ st, links: placeLinks(st) }))
    .filter((x): x is { st: (typeof STORES)[number]; links: NonNullable<ReturnType<typeof placeLinks>> } => x.links != null);
  if (rows.length === 0) return null;
  return (
    <section className={`section ${s.sec}`} aria-labelledby="review-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="review-title" className="h2-event">다녀온 뒤에</h2>
        </div>
        <p className="cap">네이버 리뷰가 다음 손님에게 큰 도움이 돼요</p>
        <ul className={s.reviews}>
          {rows.map(({ st, links }) => {
            const benefit = rules.reviewBenefit?.[st.id];
            return (
              <li key={st.id} className="row" data-store={st.id}>
                <span className="dot" aria-hidden="true" />
                <div className="body">
                  <p className="title neon">{st.shortName}</p>
                  {benefit && <p className="sub">{benefit}</p>}
                </div>
                <a className="btn btn-naver btn-sm" href={links.review} target="_blank" rel="noreferrer">리뷰 쓰기</a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
