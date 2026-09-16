import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import styles from "./Counter.module.css";

/** 첫 화면: 카운터 위에 놓인 세 집 그림 + 제목 + 한 문장 + 시작하기 */
export function Counter() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`wrap ${styles.scene}`} aria-hidden="true">
        <div className={styles.artJoseon}><Art name="poster-art-joseon" sizes="(min-width: 760px) 360px, 46vw" priority /></div>
        <div className={styles.artTokyo}><Art name="poster-art-tokyo" sizes="(min-width: 760px) 310px, 40vw" priority /></div>
        <div className={styles.artWareureu}><Art name="poster-art-wareureu" sizes="(min-width: 760px) 250px, 34vw" priority /></div>
        <svg className={styles.counter} viewBox="0 0 1000 60" preserveAspectRatio="none">
          <path d="M8 18 H992" stroke="#2b2823" strokeWidth="6" strokeLinecap="round" />
          <path d="M40 22 V56 M960 22 V56" stroke="#2b2823" strokeWidth="6" strokeLinecap="round" />
          <path d="M8 24 H992" stroke="#b8362a" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        </svg>
      </div>

      <div className={`wrap ${styles.intro}`}>
        <h1 id="hero-title" className="display">
          한 집 영수증으로,<br />
          옆집에서 한 잔 더.
        </h1>
        <p className={styles.para}>한 곳에서 계산한 영수증을 올리면, 나머지 두 곳에서 그 집 술 한 잔이 무료예요.</p>
        <ArtButton kind="start" href="/verify" width={300} />
        <p className={styles.note}>가입 없이 휴대폰 번호만 넣으면 돼요.</p>
      </div>
    </section>
  );
}
