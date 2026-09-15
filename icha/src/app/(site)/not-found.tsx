import Link from "next/link";
import { Stamp } from "@/components/ui/Stamp";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={`wrap ${styles.wrap}`}>
      <div className={`paper ${styles.paper}`}>
        <p className={`mono ${styles.code}`}>404</p>
        <h1 className={`serif ${styles.title}`}>이 주소에는<br />아무것도 없어요.</h1>
        <p className={styles.text}>주소가 바뀌었거나 잘못 들어온 것 같아요. 쿠폰이 있다면 쿠폰함에 그대로 있어요.</p>
        <div className={styles.stamp}><Stamp text="없음" size={96} color="var(--ink-3)" /></div>
        <hr className="dots" />
        <div className={styles.actions}>
          <Link href="/" className="btn btn-block">홈으로</Link>
          <Link href="/wallet" className={styles.link}>내 쿠폰함</Link>
        </div>
      </div>
    </div>
  );
}
