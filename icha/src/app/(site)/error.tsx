"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./not-found.module.css";

/** 화면이 깨졌을 때 — 제목 한 줄, 안내 한 줄, [홈으로]·[다시 시도]. */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={styles.wrap}>
      <span className={`eyebrow ${styles.code}`}>Error</span>
      <h1 className="h2">일시적인 오류입니다</h1>
      <p className="lead">잠시 후 다시 시도해 주세요.</p>
      <Button href="/" variant="primary" className={styles.btn}>홈으로</Button>
      <Button variant="ghost" className={styles.retry} onClick={() => retry()}>다시 시도</Button>
    </div>
  );
}
