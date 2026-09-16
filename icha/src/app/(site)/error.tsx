"use client";
import Link from "next/link";
import { useEffect } from "react";
import styles from "./not-found.module.css";

/** 화면이 깨졌을 때 — 한 줄 제목, 한 줄 설명, 다시 시도·홈으로. */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={`wrap ${styles.wrap}`}>
      <h1 className="h2">화면을 여는 데 잠깐 막혔어요</h1>
      <p className="cap">한 번 더 눌러 주세요. 계속 그러면 직원에게 보여 주세요.</p>
      <div className={styles.btns}>
        <button type="button" className="btn" onClick={() => retry()}>다시 시도</button>
        <Link href="/" className="btn btn-secondary">홈으로</Link>
      </div>
    </div>
  );
}
