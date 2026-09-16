import Link from "next/link";
import { formatPhone } from "@/lib/config";
import { listMembers } from "@/lib/db/queries";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { fmtShort, won } from "@/components/admin/format";
import { Pager } from "@/components/admin/Pager";
import ui from "@/app/admin/admin.module.css";

export const metadata = { title: "회원" };
const SIZE = 40;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="회원 목록" />;
  const sp = await searchParams;
  const q = (sp.q ?? "").replace(/\D/g, "");
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = await listMembers({ q: q || undefined, limit: SIZE, offset: (page - 1) * SIZE });
  const now = new Date();
  const base = `/admin/members${q ? `?q=${q}` : ""}`;

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>회원</h1>
          <p className={ui.pageDesc}>카운터에서 번호를 넣었거나 손님이 번호로 로그인한 사람. {total.toLocaleString("ko-KR")}명.</p>
        </div>
      </div>
      <form method="get" action="/admin/members" className={ui.filterBar}>
        <input name="q" className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" placeholder="전화번호 일부" defaultValue={q} aria-label="전화번호 검색" />
        <button type="submit" className={`${ui.button} ${ui.buttonGhost}`}>
          검색
        </button>
      </form>
      <div className={ui.panel}>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>전화번호</th>
                <th className={ui.right}>릴레이</th>
                <th className={ui.right}>누적 금액</th>
                <th>최근 로그인</th>
                <th>가입</th>
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className={ui.empty}>
                    조건에 맞는 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/admin/members/${m.id}`} className={`${ui.rowLink} ${ui.mono}`}>
                        {formatPhone(m.phone)}
                      </Link>
                    </td>
                    <td className={ui.num}>{m.visitCount}회</td>
                    <td className={ui.num}>{m.totalSpend > 0 ? won(m.totalSpend) : "-"}</td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(m.lastLoginAt, now)}</td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(m.createdAt, now)}</td>
                    <td className={ui.dim} style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.memo ?? ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pager total={total} page={page} size={SIZE} base={base} />
    </>
  );
}
