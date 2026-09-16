import Link from "next/link";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { subwaySummary } from "@/lib/locations";
import styles from "./Counter.module.css";

/** 첫 화면: 술집 카운터 위에 세 집의 그림이 놓인 장면 + 사장님이 직접 설명하듯 쓴 소개 */
export function Counter() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`wrap ${styles.scene}`} aria-hidden="true">
        <div className={styles.artJoseon}><Art name="poster-art-joseon" sizes="(min-width: 760px) 420px, 46vw" priority /></div>
        <div className={styles.artTokyo}><Art name="poster-art-tokyo" sizes="(min-width: 760px) 360px, 40vw" priority /></div>
        <div className={styles.artWareureu}><Art name="poster-art-wareureu" sizes="(min-width: 760px) 300px, 34vw" priority /></div>
        <svg className={styles.counter} viewBox="0 0 1000 60" preserveAspectRatio="none">
          <path d="M8 18 H992" stroke="#2b2823" strokeWidth="6" strokeLinecap="round" />
          <path d="M40 22 V56 M960 22 V56" stroke="#2b2823" strokeWidth="6" strokeLinecap="round" />
          <path d="M8 24 H992" stroke="#b8362a" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        </svg>
      </div>

      <div className={`wrap ${styles.intro}`}>
        <p className={styles.eyebrow}>서면 2차 연합 · 조선칼국수 × 도쿄스탠드 × 와르르맨숀</p>
        <h1 id="hero-title" className="display">
          한 집 영수증으로,<br />
          옆집에서 한 잔 더.
        </h1>
        <p className={styles.para}>
          조선칼국수, 도쿄스탠드, 와르르맨숀은 {subwaySummary()} 거리에 모여 있는 세 술집이에요. 세 집이 같이 작은 이벤트를 해요.
          한 곳에서 계산한 영수증을 사진으로 올려 주시면, 나머지 두 곳 중 한 곳에서 그 집 술 한 잔을 무료로 드려요.
          조선칼국수는 막걸리, 도쿄스탠드는 생맥주, 와르르맨숀은 소주예요.
        </p>
        <p className={styles.para}>
          앱을 깔거나 회원 가입을 할 필요는 없어요. 휴대폰 번호만 넣으면 쿠폰이 그 번호에 보관돼요.
        </p>
        <div className={styles.badges}>
          <Link href="/stores/joseon"><Art name="badge-joseon" alt="조선칼국수" width={170} /></Link>
          <Link href="/stores/tokyo"><Art name="badge-tokyo" alt="도쿄스탠드" width={170} /></Link>
          <Link href="/stores/wareureu"><Art name="badge-wareureu" alt="와르르맨숀" width={170} /></Link>
        </div>
        <div className={styles.actions}>
          <ArtButton kind="start" href="/verify" width={300} />
          <Link href="#how" className={styles.textLink}>어떻게 하는지 먼저 볼게요 ↓</Link>
        </div>
      </div>
    </section>
  );
}
