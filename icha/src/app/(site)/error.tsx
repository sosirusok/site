"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./not-found.module.css";

/** 화면이 깨졌을 때 — 404 와 같은 모양(왼쪽 밖으로 흘러나가는 큰 글자 + 겹친 제목). */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={styles.wrap}>
      <span className={styles.big} aria-hidden="true">ERR</span>
      <h1 className="d2">잠깐 멈췄습니다</h1>
      <p className="lead">화면을 불러오지 못했습니다. 다시 시도해 주시고, 그래도 안 되면 매장으로 전화 주세요.</p>
      <Button href="/" variant="primary" className={styles.btn}>홈으로</Button>
      <Button variant="ghost" className={styles.retry} onClick={() => retry()}>다시 시도</Button>
    </div>
  );
}
