"use client";
import Link from "next/link";
import { useEffect } from "react";
import { KitCut } from "@/components/flow/kit";
import styles from "./not-found.module.css";

/** 화면이 깨졌을 때 — 키트의 쓰러진 소주잔, 간판 한 줄, 어두운 띠 안내 한 줄, 홈(노란 스티커)·다시 시도(작은 글자). */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={styles.wrap}>
      <KitCut name="notfound" width={150} className={styles.cut} />
      <h1 className={`plate plate-red ${styles.h1}`}>일시적인 오류입니다</h1>
      <p className={`${styles.strip} ${styles.sub}`}>잠시 후 다시 시도해 주세요</p>
      <Link href="/" className={`btn ${styles.btn}`}>홈</Link>
      <button type="button" className={`link link-w ${styles.retry} ${styles.pill}`} onClick={() => retry()}>다시 시도</button>
    </div>
  );
}
