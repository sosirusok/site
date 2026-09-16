import Link from "next/link";
import { formatPhone } from "@/lib/config";
import { listMembers } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { fmtShort, tierName, won } from "@/components/admin/format";
import { Pager } from "@/components/admin/Pager";
import ui from "@/app/admin/admin.module.css";

export const metadata = { title: "회원" };
const SIZE = 40;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; tier?: string; page?: string }> }) {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="회원 목록" />;
  const sp = await searchParams;
  const rules = await getRules();
  const q = (sp.q ?? "").replace(/\D/g, "");
  const tier = sp.tier && (sp.tier === "none" || rules.tiers.some((t) => t.key === sp.tier)) ? sp.tier : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = await listMembers({ q: q || undefined, tier: tier || undefined, limit: SIZE, offset: (page - 1) * SIZE });
  const now = new Date();
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (tier) qs.set("tier", tier);
  const base = `/admin/members${qs.size ? `?${qs}` : ""}`;

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>회원</h1>
          <p className={ui.pageDesc}>누적 결제 금액이 큰 순서. 등급은 승인 시점에 갱신되고, 설정에서 기준을 바꾸면 재계산할 수 있습니다.</p>
        </div>
        <div className={ui.pageActions}>
          <Link href="/admin/vip" className={`${ui.button} ${ui.buttonGhost}`}>
            등급별 쿠폰 발급
          </Link>
        </div>
      </div>
      <form method="get" action="/admin/members" className={ui.filterBar}>
        <div className={ui.chips} role="group" aria-label="등급">
          {[{ key: "", name: "전체" }, { key: "none", name: "일반" }, ...rules.tiers].map((t) => {
            const p = new URLSearchParams(qs);
            if (t.key) p.set("tier", t.key);
            else p.delete("tier");
            return (
              <Link key={t.key} href={`/admin/members${p.size ? `?${p}` : ""}`} className={`${ui.chip} ${tier === t.key ? ui.chipActive : ""}`}>
                {t.name}
              </Link>
            );
          })}
        </div>
        {tier ? <input type="hidden" name="tier" value={tier} /> : null}
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
                <th>등급</th>
                <th className={ui.right}>누적 금액</th>
                <th className={ui.right}>방문</th>
                <th>최근 로그인</th>
                <th>가입</th>
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className={ui.empty}>
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
                    <td>{tierName(m.tier, rules.tiers)}</td>
                    <td className={ui.num}>{won(m.totalSpend)}</td>
                    <td className={ui.num}>{m.visitCount}회</td>
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
