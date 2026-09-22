"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdultResult } from "./AdultResult";
import { runIdentityVerification, type IdentityOutcome } from "./identity";
import styles from "./AdultCheck.module.css";

type View = { s: "idle" } | { s: "busy" } | { s: "done"; adult: boolean; verifiedAt: string } | { s: "error"; message: string };

/** 버튼 하나 → 통신사 본인확인창 → 결과 한 글자. */
export function AdultCheck() {
  const [view, setView] = useState<View>({ s: "idle" });

  async function start() {
    setView({ s: "busy" });
    let out: IdentityOutcome;
    try {
      out = await runIdentityVerification(() => setView({ s: "error", message: "성인 확인이 아직 연결되지 않았습니다." }));
    } catch {
      setView({ s: "error", message: "인증창을 열지 못했습니다." });
      return;
    }
    if (out.kind === "left") return; // 인증창으로 화면이 넘어갔다. 돌아오면 /adult/done 이 받는다
    if (out.kind === "result") setView({ s: "done", adult: out.adult, verifiedAt: out.verifiedAt });
    else setView({ s: "error", message: out.message });
  }

  return (
    <div className={styles.page} data-footer="short">
      <h1 className="h1">성인 확인</h1>
      {view.s === "done" ? (
        <AdultResult adult={view.adult} verifiedAt={view.verifiedAt} onAgain={() => setView({ s: "idle" })} />
      ) : (
        <>
          <Button type="button" variant="primary" size="lg" block disabled={view.s === "busy"} aria-busy={view.s === "busy" || undefined} onClick={start}>
            {view.s === "busy" ? "여는 중…" : "휴대폰으로 확인"}
          </Button>
          {view.s === "error" && <p className="error" role="alert">{view.message}</p>}
          <p className="fineprint">통신사 본인확인 화면이 열립니다. 결과만 보여 주고 아무것도 저장하지 않습니다.</p>
        </>
      )}
    </div>
  );
}
