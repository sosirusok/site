import s from "./home.module.css";

/** 핵심 혜택 한 장 — 버튼은 화면 아래 고정 버튼(StickyCta)이 맡는다 */
export function Benefit() {
  return (
    <section className={`wrap ${s.benefit}`} aria-labelledby="benefit-title">
      <div className="card">
        <h1 id="benefit-title" className="h1">한 집 영수증으로<br />옆집에서 한 잔 더</h1>
        <p className={s.desc}>세 집 중 한 곳 영수증을 올리면 나머지 두 곳에서 그 집 술 한 잔이 무료예요.</p>
        <p className="cap">가입 없이 휴대폰 번호만으로</p>
      </div>
    </section>
  );
}
