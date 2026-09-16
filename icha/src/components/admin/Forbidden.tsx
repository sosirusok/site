import Link from "next/link";
import ui from "@/app/admin/admin.module.css";

/** 직원 계정이 총괄 전용 화면에 들어왔을 때 */
export function Forbidden({ what = "이 화면" }: { what?: string }) {
  return (
    <div className={`${ui.panel} ${ui.forbidden}`}>
      <h2>{what}은 총괄 관리자만 볼 수 있습니다.</h2>
      <p className={ui.dim}>직원 계정은 카운터와 쿠폰 조회만 할 수 있습니다.</p>
      <p style={{ marginTop: 14 }}>
        <Link href="/admin/counter" className={`${ui.button} ${ui.buttonGhost}`}>
          카운터로
        </Link>
      </p>
    </div>
  );
}
