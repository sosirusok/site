import Link from "next/link";
import { KitCut } from "@/components/flow/kit";
import styles from "./not-found.module.css";

/** 없는 주소 — 키트의 쓰러진 소주잔(오려 낸 그림), 간판 한 줄, 손글씨 한 줄, 노란 스티커 홈으로. */
export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <KitCut name="notfound" width={150} className={styles.cut} priority />
      <h1 className={`plate plate-red ${styles.h1}`}>없는 주소예요</h1>
      <p className={`hand hand-w ${styles.sub}`}>주소가 바뀌었거나 잘못 적힌 것 같아요.</p>
      <Link href="/" className={`btn ${styles.btn}`}>홈으로</Link>
    </div>
  );
}
