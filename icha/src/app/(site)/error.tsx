"use client";
import Link from "next/link";
import { useEffect } from "react";
import styles from "./not-found.module.css";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={`wrap ${styles.wrap}`}>
      <div className={`paper ${styles.paper}`}>
        <p className={`mono ${styles.code}`}>ERROR</p>
        <h1 className={styles.title}>화면을 불러오지 못했습니다.</h1>
        <p className={styles.text}>일시적인 문제일 수 있습니다. 다시 시도해도 같으면 매장 직원에게 이 화면을 보여 주십시오.</p>
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={() => retry()}>다시 시도</button>
          <Link href="/" className="btn btn-outline">홈으로</Link>
        </div>
        {error.digest && <p className={`mono ${styles.detail}`}>오류 번호 {error.digest}</p>}
      </div>
    </div>
  );
}
