import Link from "next/link";
import { KitCut } from "@/components/flow/kit";
import styles from "./not-found.module.css";

/** 없는 주소 — 키트의 쓰러진 소주잔(오려 낸 그림), 간판 한 줄, 어두운 띠 안내 한 줄, 노란 스티커 홈. */
export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <KitCut name="notfound" width={150} className={styles.cut} priority />
      <h1 className={`plate plate-red ${styles.h1}`}>페이지를 찾을 수 없습니다</h1>
      <p className={`${styles.strip} ${styles.sub}`}>주소를 다시 확인해 주세요</p>
      <Link href="/" className={`btn ${styles.btn}`}>홈</Link>
    </div>
  );
}
