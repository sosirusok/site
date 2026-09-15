import Link from "next/link";
import ui from "@/app/admin/admin.module.css";

export default function AdminNotFound() {
  return (
    <div className={`${ui.panel} ${ui.forbidden}`}>
      <h2>찾는 항목이 없습니다.</h2>
      <p className={ui.dim}>삭제되었거나 주소가 잘못되었습니다.</p>
      <p style={{ marginTop: 14 }}>
        <Link href="/admin" className={`${ui.button} ${ui.buttonGhost}`}>
          대시보드로
        </Link>
      </p>
    </div>
  );
}
