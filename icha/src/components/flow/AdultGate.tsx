"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { runIdentityVerification, type IdentityOutcome } from "./identity";

/** 로그인은 되어 있고 성인 확인만 남은 손님용 버튼 — 성공하면 원래 가려던 화면으로 보낸다 */
export function AdultGate({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    let out: IdentityOutcome;
    try {
      out = await runIdentityVerification(next, () => setError("본인확인이 아직 연결되지 않았습니다."));
    } catch {
      setBusy(false);
      setError("본인확인창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (out.kind === "left") return;
    if (out.kind === "done") {
      window.location.assign(out.next);
      return;
    }
    setBusy(false);
    // 로그인된 상태에서 부르므로 서버는 번호를 다시 묻지 않는다. 그래도 왔다면 그냥 보내면 문지기에게 다시 튕기므로 알린다.
    setError(out.kind === "need-phone" ? "확인은 됐는데 계정에 연결하지 못했습니다. 다시 시도해 주세요." : out.message);
  }

  return (
    <>
      <Button type="button" variant="primary" size="lg" block disabled={busy} aria-busy={busy || undefined} onClick={onClick}>
        {busy ? "인증창 여는 중…" : "휴대폰 본인확인"}
      </Button>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
