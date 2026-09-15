"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Stamp } from "@/components/ui/Stamp";
import styles from "./not-found.module.css";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={`wrap ${styles.wrap}`}>
      <div className={`paper paper-shadow ${styles.paper}`}>
        <p className={styles.code}>오류</p>
        <h1 className={styles.title}>화면을 그리다<br />막혔어요.</h1>
        <p className={styles.text}>잠깐 문제가 생긴 것 같아요. 다시 시도해도 안 되면 매장 직원에게 이 화면을 보여 주세요.</p>
        <div className={styles.stamp}><Stamp text="재시도" size={96} /></div>
        <hr className="dots" />
        <div className={styles.actions}>
          <button type="button" className="btn btn-block btn-dark" onClick={() => retry()}>다시 시도</button>
          <Link href="/" className={styles.link}>홈으로</Link>
        </div>
        {error.digest && <p className={styles.detail}>오류 번호 {error.digest}</p>}
      </div>
    </div>
  );
}
