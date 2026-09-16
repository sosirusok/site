import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={`wrap ${styles.wrap}`}>
      <div className={`paper ${styles.paper}`}>
        <p className={`mono ${styles.code}`}>404</p>
        <h1 className={styles.title}>요청하신 페이지가 없습니다.</h1>
        <p className={styles.text}>주소가 바뀌었거나 잘못 입력된 것 같습니다. 받은 쿠폰은 쿠폰함에 그대로 있습니다.</p>
        <div className={styles.actions}>
          <Link href="/" className="btn">홈으로</Link>
          <Link href="/wallet" className="btn btn-outline">쿠폰함</Link>
        </div>
      </div>
    </div>
  );
}
