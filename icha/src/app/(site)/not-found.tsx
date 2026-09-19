import { Button } from "@/components/ui/Button";
import styles from "./not-found.module.css";

/** 없는 주소 — 가운데 한 덩어리: 404, 제목, 한 줄, [홈으로]. */
export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <span className={`eyebrow ${styles.code}`}>404</span>
      <h1 className="h2">페이지를 찾을 수 없습니다</h1>
      <p className="lead">주소를 다시 확인해 주세요.</p>
      <Button href="/" variant="primary" className={styles.btn}>홈으로</Button>
    </div>
  );
}
