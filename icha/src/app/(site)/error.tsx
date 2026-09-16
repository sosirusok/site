"use client";
import Link from "next/link";
import { useEffect } from "react";
import styles from "./not-found.module.css";

/** 화면이 깨졌을 때 — 간판 한 줄, 손글씨 한 줄, 홈으로(노란 스티커)·다시 시도(작은 글자). */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={styles.wrap}>
      <h1 className={`plate plate-red ${styles.h1}`}>잠깐 막혔어요</h1>
      <p className={`hand hand-w ${styles.sub}`}>한 번 더 열어 주세요. 계속 그러면 직원에게 보여 주세요.</p>
      <Link href="/" className={`btn ${styles.btn}`}>홈으로</Link>
      <button type="button" className={`link link-w ${styles.retry}`} onClick={() => retry()}>다시 시도</button>
    </div>
  );
}
