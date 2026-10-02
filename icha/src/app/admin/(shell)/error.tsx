"use client";
import { unstable_isUnrecognizedActionError } from "next/navigation";
import { useEffect } from "react";
import ui from "@/app/admin/admin.module.css";

/**
 * 관리자 화면 오류 — 위쪽 메뉴는 그대로 두고 이 칸만 바꾼다(없으면 Next 의 영어 오류 화면이 관리자 전체를 덮는다).
 * 배포 뒤 오래 열어 둔 태블릿은 예전 버튼 번호로 요청해 실패한다 — 그때는 새로고침 한 번이면 된다(누를 때만 요청하므로 되풀이되지 않는다).
 */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const stale = unstable_isUnrecognizedActionError(error);
  useEffect(() => {
    console.error(error);
    if (stale) window.location.reload();
  }, [error, stale]);
  return (
    <div className={`${ui.panel} ${ui.panelBody}`} role="alert" style={{ display: "grid", gap: 10 }}>
      <h2 className={ui.panelTitle}>{stale ? "새 버전으로 다시 불러옵니다" : "연결이 잠깐 끊겼습니다"}</h2>
      <p className={ui.help}>방금 누른 작업이 처리됐는지는 새로고침한 뒤 목록에서 확인할 수 있습니다.</p>
      <div className={ui.inline}>
        <button type="button" className={ui.button} onClick={() => retry()}>
          다시 시도
        </button>
        <button type="button" className={`${ui.button} ${ui.buttonGhost}`} onClick={() => window.location.reload()}>
          새로고침
        </button>
      </div>
    </div>
  );
}
