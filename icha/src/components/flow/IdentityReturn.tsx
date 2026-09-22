"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdultResult } from "./AdultResult";
import { confirmIdentity } from "./identity";
import styles from "./AdultCheck.module.css";

type View = { s: "working" } | { s: "done"; adult: boolean; verifiedAt: string } | { s: "error"; message: string };

/**
 * 인증창에서 돌아오는 자리(redirectUrl). 모바일은 인증창이 화면을 통째로 가져가므로
 * 끝나면 여기로 ?identityVerificationId=... 가 붙어 되돌아온다. 그 값을 서버에 넘겨 판정받는다.
 */
export function IdentityReturn() {
  const [view, setView] = useState<View>({ s: "working" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const q = new URLSearchParams(window.location.search);
    const id = q.get("identityVerificationId");
    if (q.get("code")) { setView({ s: "error", message: q.get("message") || "취소되었습니다." }); return; }
    if (!id) { setView({ s: "error", message: "결과가 없습니다." }); return; }
    confirmIdentity(id)
      .then((out) => setView(out.kind === "result" ? { s: "done", adult: out.adult, verifiedAt: out.verifiedAt } : { s: "error", message: out.kind === "error" ? out.message : "확인하지 못했습니다." }))
      .catch(() => setView({ s: "error", message: "네트워크 연결을 확인해 주세요." }));
  }, []);

  return (
    <div className={styles.page} data-footer="short">
      <h1 className="h1">성인 확인</h1>
      {view.s === "working" && <p role="status">확인 중…</p>}
      {view.s === "done" && <AdultResult adult={view.adult} verifiedAt={view.verifiedAt} onAgain={() => window.location.assign("/adult")} />}
      {view.s === "error" && (
        <>
          <p className="error" role="alert">{view.message}</p>
          <Button href="/adult" variant="primary" size="lg" block>다시 확인</Button>
        </>
      )}
    </div>
  );
}
