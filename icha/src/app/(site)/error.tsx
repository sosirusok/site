"use client";
import Link from "next/link";
import { useEffect } from "react";
import styles from "./not-found.module.css";

/** 화면이 깨졌을 때 — 한 줄 제목, 한 줄 설명, 홈으로(크게)·다시 시도(작게). */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={`wrap ${styles.wrap}`}>
      <h1 className="h1-event">잠깐 막혔어요</h1>
      <p className="cap">한 번 더 열어 주세요. 계속 그러면 직원에게 보여 주세요.</p>
      <Link href="/" className={`btn ${styles.btn}`}>홈으로</Link>
      <button type="button" className="btn btn-text" onClick={() => retry()}>다시 시도</button>
    </div>
  );
}
