"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { confirmIdentity } from "./identity";
import styles from "./IdentityReturn.module.css";

type View = { stage: "working" } | { stage: "error"; message: string } | { stage: "need-phone"; next: string };

/**
 * 인증창에서 돌아왔을 때 한 번만 서버에 확정을 요청하고 원래 가려던 곳으로 보낸다.
 * 주소에 붙어 온 id 를 그대로 믿지 않는다 — 서버가 진행 쿠키와 대조하고 포트원에 직접 다시 묻는다.
 */
export function IdentityReturn() {
  const [view, setView] = useState<View>({ stage: "working" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const q = new URLSearchParams(window.location.search);
    const id = q.get("identityVerificationId");
    const code = q.get("code");
    if (code) {
      setView({ stage: "error", message: q.get("message") || "본인확인이 취소되었습니다." });
      return;
    }
    if (!id) {
      setView({ stage: "error", message: "본인확인 결과가 없습니다. 처음부터 다시 해 주세요." });
      return;
    }
    confirmIdentity(id)
      .then((out) => {
        if (out.kind === "done") {
          window.location.replace(out.next);
          return;
        }
        if (out.kind === "need-phone") {
          setView({ stage: "need-phone", next: out.next });
          return;
        }
        setView({ stage: "error", message: out.kind === "error" ? out.message : "본인확인에 실패했습니다." });
      })
      .catch(() => setView({ stage: "error", message: "네트워크 연결을 확인해 주세요." }));
  }, []);

  if (view.stage === "working") {
    return (
      <div className={styles.page}>
        <p className={`d2 ${styles.big}`}>확인 중</p>
        <p className={styles.line} role="status">통신사에서 받은 결과를 맞춰 보고 있습니다.</p>
      </div>
    );
  }

  if (view.stage === "need-phone") {
    return (
      <div className={styles.page}>
        <p className={`d2 ${styles.big}`}>성인 확인 완료</p>
        <p className={styles.line}>계산할 때 대신 번호만 넣으시면 쿠폰함이 열립니다.</p>
        <Button href={`/login?next=${encodeURIComponent(view.next)}`} variant="primary" size="lg" block>번호 넣고 들어가기</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <p className={`d2 ${styles.big}`}>확인하지 못했습니다</p>
      <p className={styles.line} role="alert">{view.message}</p>
      <Button href="/login" variant="primary" size="lg" block>다시 하기</Button>
    </div>
  );
}
