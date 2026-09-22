"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { runIdentityVerification, type IdentityOutcome } from "./identity";
import { PhoneForm } from "./PhoneForm";
import { safeNext } from "./format";
import styles from "./LoginPanel.module.css";

type Mode = "identity" | "phone";

/**
 * 로그인 입구.
 *
 * 본인확인이 연결돼 있으면 통신사 본인확인창 하나로 끝난다 — 통신사가 확인해 준 번호가 곧 계정이라
 * 번호를 손으로 칠 필요도 없고, 남의 번호를 쳐서 남의 쿠폰함을 여는 일도 막힌다.
 *
 * 빠져나갈 문을 두지 않는다. "번호만 넣고 들어가기" 버튼이 옆에 있으면 그건 성인 확인이 아니다.
 * 번호 입력으로 내려가는 경우는 둘뿐 — 아직 계약 전이라 서버가 못 쓴다고 답할 때(503),
 * 그리고 통신사가 번호를 안 주는 계약이라 성인 확인만 끝난 때.
 */
export function LoginPanel({ identityConfigured }: { identityConfigured: boolean }) {
  const [mode, setMode] = useState<Mode>(identityConfigured ? "identity" : "phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adultDone, setAdultDone] = useState(false);

  async function onVerify() {
    setBusy(true);
    setError(null);
    let out: IdentityOutcome;
    try {
      out = await runIdentityVerification(nextFromUrl(), () => setMode("phone"));
    } catch {
      setBusy(false);
      setError("본인확인창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (out.kind === "left") return; // 인증창으로 화면이 넘어갔다. 돌아오면 /login/done 이 받는다
    if (out.kind === "done") {
      window.location.assign(out.next);
      return;
    }
    setBusy(false);
    if (out.kind === "need-phone") {
      setAdultDone(true);
      setMode("phone");
      return;
    }
    setError(out.message);
  }

  if (mode === "phone") {
    return (
      <div className={styles.wrap}>
        {adultDone && <p className={styles.okline}>성인 확인이 끝났습니다. 계산할 때 대신 번호만 넣어 주세요.</p>}
        <PhoneForm />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <Button type="button" variant="primary" size="lg" block disabled={busy} aria-busy={busy || undefined} onClick={onVerify}>
        {busy ? "인증창 여는 중…" : "휴대폰 본인확인"}
      </Button>
      {error && <p className={`error ${styles.err}`} role="alert">{error}</p>}
      <p className={styles.note}>
        통신사 본인확인 화면이 열립니다. 술을 다루는 행사라 만 19세 이상만 참여할 수 있어 확인이 필요합니다.
        확인이 끝나면 <b>성인 여부</b>만 남기고 이름·생년월일은 저장하지 않습니다.
      </p>
    </div>
  );
}

function nextFromUrl(): string {
  if (typeof window === "undefined") return "/wallet";
  return safeNext(new URLSearchParams(window.location.search).get("next") ?? undefined, "/wallet");
}
