import Link from "next/link";
import styles from "./not-found.module.css";

/** 없는 주소 — 가운데에 한 줄 제목, 한 줄 설명, 홈으로. */
export default function NotFound() {
  return (
    <div className={`wrap ${styles.wrap}`}>
      <h1 className="h1-event">없는 주소예요</h1>
      <p className="cap">주소가 바뀌었거나 잘못 적힌 것 같아요.</p>
      <Link href="/" className={`btn ${styles.btn}`}>홈으로</Link>
    </div>
  );
}
