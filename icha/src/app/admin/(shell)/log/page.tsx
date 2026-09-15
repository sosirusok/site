import { formatPhone } from "@/lib/config";
import { listAudit } from "@/lib/db/queries";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { AUDIT_ACTION, fmtDateTime } from "@/components/admin/format";
import ui from "@/app/admin/admin.module.css";

export const metadata = { title: "로그" };

function metaText(meta: unknown): string {
  if (meta == null) return "";
  if (typeof meta === "string") return meta;
  try {
    const o = meta as Record<string, unknown>;
    return Object.entries(o)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join("  ");
  } catch {
    return String(meta);
  }
}

export default async function LogPage() {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="로그" />;
  const rows = await listAudit(200);
  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>변경 로그</h1>
          <p className={ui.pageDesc}>관리자와 직원이 한 일 최근 200건. 손님의 쿠폰 사용은 쿠폰 조회에서 봅니다.</p>
        </div>
      </div>
      <div className={ui.panel}>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>시각</th>
                <th>계정</th>
                <th>작업</th>
                <th>대상</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className={ui.empty}>
                    아직 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{fmtDateTime(r.at)}</td>
                    <td className={ui.mono}>{r.actor}</td>
                    <td>
                      {AUDIT_ACTION[r.action] ?? r.action}
                      {AUDIT_ACTION[r.action] ? <span className={`${ui.dim} ${ui.mono}`} style={{ fontSize: 13, marginLeft: 6 }}>{r.action}</span> : null}
                    </td>
                    <td className={ui.mono} title={r.target ?? ""}>
                      {r.target ? (/^\d{10,11}$/.test(r.target) ? formatPhone(r.target) : r.target.length > 12 ? `${r.target.slice(0, 8)}…` : r.target) : ""}
                    </td>
                    <td className={`${ui.dim} ${ui.mono}`} style={{ fontSize: 13, maxWidth: 480, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={metaText(r.meta)}>
                      {metaText(r.meta)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
