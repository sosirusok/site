import Link from "next/link";
import { formatPhone, maskPhone, reasonText } from "@/lib/config";
import { listReceipts, type ReceiptStatus } from "@/lib/db/queries";
import { STORES } from "@/lib/stores";
import { requireAdminPage, phoneFor } from "@/components/admin/guard";
import { fmtShort, won } from "@/components/admin/format";
import { ReceiptBadge } from "@/components/admin/Badge";
import { StoreTag } from "@/components/admin/StoreTag";
import { Pager } from "@/components/admin/Pager";
import ui from "@/app/admin/admin.module.css";
import s from "./receipts.module.css";

export const metadata = { title: "영수증 확인" };

const SIZE = 30;
const STATUSES: { key: string; label: string }[] = [
  { key: "", label: "전체" },
  { key: "review", label: "확인 대기" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "반려" },
];

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<{ status?: string; store?: string; q?: string; page?: string }> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const status = (["approved", "review", "rejected"] as const).find((x) => x === sp.status) as ReceiptStatus | undefined;
  const store = STORES.find((x) => x.id === sp.store)?.id ?? null;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  // 직원 계정은 자기 매장 영수증과 매장을 읽지 못한 건만 본다
  const staffStore = session.role === "staff" ? session.storeId : null;
  const { items, total } = await listReceipts({ status, storeId: staffStore ? null : store, storeIdOrNull: staffStore, q: q || undefined, limit: SIZE, offset: (page - 1) * SIZE });
  const myStore = staffStore ? STORES.find((x) => x.id === staffStore) : null;
  const now = new Date();
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (store) qs.set("store", store);
  if (q) qs.set("q", q);
  const base = `/admin/receipts${qs.size ? `?${qs}` : ""}`;

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>영수증 확인</h1>
          <p className={ui.pageDesc}>
            확인 대기 건이 먼저 보입니다. 행을 누르면 사진과 읽은 값을 보고 판정합니다.
            {myStore ? ` ${myStore.shortName} 영수증과 매장을 읽지 못한 건만 보입니다.` : ""}
          </p>
        </div>
      </div>

      <form method="get" action="/admin/receipts" className={ui.filterBar}>
        <div className={ui.chips} role="group" aria-label="상태">
          {STATUSES.map((st) => {
            const p = new URLSearchParams(qs);
            if (st.key) p.set("status", st.key);
            else p.delete("status");
            return (
              <Link key={st.key} href={`/admin/receipts${p.size ? `?${p}` : ""}`} className={`${ui.chip} ${(status ?? "") === st.key ? ui.chipActive : ""}`}>
                {st.label}
              </Link>
            );
          })}
        </div>
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="sr-only" htmlFor="f-store">
          매장
        </label>
        <select id="f-store" name="store" className={ui.select} defaultValue={staffStore ?? store ?? ""} disabled={Boolean(staffStore)}>
          <option value="">모든 매장</option>
          {STORES.map((st) => (
            <option key={st.id} value={st.id}>
              {st.shortName}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-q">
          전화번호 검색
        </label>
        <input id="f-q" name="q" className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" placeholder="전화번호 뒷자리" defaultValue={q} />
        <button type="submit" className={`${ui.button} ${ui.buttonGhost}`}>
          검색
        </button>
      </form>

      <div className={ui.panel}>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={s.thumbCell}>사진</th>
                <th>접수</th>
                <th>상태</th>
                <th>매장</th>
                <th>결제 일시</th>
                <th className={ui.right}>금액</th>
                <th>회원</th>
                <th>사유 / 메모</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className={ui.empty}>
                    조건에 맞는 영수증이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className={r.status === "review" ? ui.rowHi : ""}>
                    <td>
                      <Link href={`/admin/receipts/${r.id}`}>
                        {r.hasImage ? <img src={`/api/receipts/${r.id}/image?w=120`} alt="" className={ui.thumb} loading="lazy" /> : <span className={ui.thumb} title="보관 기간이 지나 사진 삭제됨" />}
                      </Link>
                    </td>
                    <td className={ui.nowrap}>
                      <Link href={`/admin/receipts/${r.id}`} className={`${ui.rowLink} ${ui.mono}`}>
                        {fmtShort(r.createdAt, now)}
                      </Link>
                    </td>
                    <td>
                      <ReceiptBadge status={r.status} />
                    </td>
                    <td>
                      <StoreTag id={r.storeId} />
                    </td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(r.receiptAt, now)}</td>
                    <td className={ui.num}>{won(r.amount)}</td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{r.memberPhone ? phoneFor(session, r.memberPhone, maskPhone, formatPhone) : "-"}</td>
                    <td className={`${ui.dim} ${ui.wrapCell}`}>
                      {r.reasons.slice(0, 2).map(reasonText).join(" · ") || "-"}
                      {r.reviewNote ? <span> — {r.reviewNote}</span> : null}
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
