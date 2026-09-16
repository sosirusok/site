import Link from "next/link";
import { Art } from "@/components/art/Art";
import styles from "./not-found.module.css";

/** 없는 주소 — 빈 클립보드 그림 위에 한 문장. */
export default function NotFound() {
  return (
    <div className={`wrap ${styles.wrap}`}>
      <div className={styles.art}>
        <Art name="empty-holder" alt="" sizes="(min-width: 760px) 220px, 55vw" priority />
      </div>
      <h1 className={`h1 ${styles.title}`}>여기엔 아무것도 없어요.</h1>
      <p className={styles.text}>주소가 바뀌었거나 잘못 적힌 것 같아요. 받아 둔 쿠폰은 쿠폰함에 그대로 있어요.</p>
      <div className={styles.actions}>
        <Link href="/" className="btn">홈으로</Link>
        <Link href="/wallet" className="btn btn-outline">쿠폰함</Link>
      </div>
    </div>
  );
}
