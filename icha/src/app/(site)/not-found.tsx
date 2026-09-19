import { Button } from "@/components/ui/Button";
import styles from "./not-found.module.css";

/** 없는 주소 — 왼쪽 밖으로 흘러나가는 404 위에 제목이 겹친다. 가운데 정렬로 화면을 비워 두지 않는다. */
export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <span className={styles.big} aria-hidden="true">404</span>
      <h1 className="d2">이런 주소는 없습니다</h1>
      <p className="lead">주소를 다시 확인해 주시거나, 아래로 홈에 가 주세요.</p>
      <Button href="/" variant="primary" className={styles.btn}>홈으로</Button>
    </div>
  );
}
