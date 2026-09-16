"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Art } from "@/components/art/Art";
import styles from "./not-found.module.css";

/** 화면이 깨졌을 때 — 다시 시도 그림 위에 한 문장. */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={`wrap ${styles.wrap}`}>
      <div className={styles.art}>
        <Art name="retry" alt="" sizes="(min-width: 760px) 220px, 55vw" priority />
      </div>
      <h1 className={`h1 ${styles.title}`}>화면을 불러오다 잠깐 막혔어요.</h1>
      <p className={styles.text}>한 번 더 눌러 주세요. 그래도 같으면 매장 직원에게 이 화면을 보여 주세요.</p>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={() => retry()}>다시 시도</button>
        <Link href="/" className="btn btn-outline">홈으로</Link>
      </div>
    </div>
  );
}
