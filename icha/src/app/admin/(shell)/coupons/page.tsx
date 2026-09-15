import Link from "next/link";
import { formatPhone, maskPhone } from "@/lib/config";
import { findCouponByCode, listCoupons, type CouponStatus } from "@/lib/db/queries";
import { STORES, getStore } from "@/lib/stores";
import { requireAdminPage, phoneFor } from "@/components/admin/guard";
import { COUPON_KIND, fmtDateTime, fmtShort } from "@/components/admin/format";
import { CouponBadge } from "@/components/admin/Badge";
import { StoreTag } from "@/components/admin/StoreTag";
import { Pager } from "@/components/admin/Pager";
import { CouponCodeInput } from "@/components/admin/CouponCodeInput";
import { CouponActions } from "@/components/admin/CouponActions";
import ui from "@/app/admin/admin.module.css";
import s from "./coupons.module.css";

export const metadata = { title: "쿠폰 조회" };

const SIZE = 30;
const STATUSES: { key: string; label: string }[] = [
  { key: "", label: "전체" },
  { key: "active", label: "사용 가능" },
  { key: "used", label: "사용됨" },
  { key: "expired", label: "만료" },
  { key: "void", label: "취소" },
];

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ code?: string; status?: string; store?: string; q?: string; page?: string }> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const code = (sp.code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const looked = code.length >= 4 ? await findCouponByCode(code) : null;
  const status = (["active", "used", "expired", "void"] as const).find((x) => x === sp.status) as CouponStatus | undefined;
  const store = STORES.find((x) => x.id === sp.store)?.id ?? null;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const listStore = session.role === "staff" && session.storeId ? session.storeId : store;
  const { items, total } = await listCoupons({ status, storeId: listStore, q: q || undefined, limit: SIZE, offset: (page - 1) * SIZE });
  const now = new Date();
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (store) qs.set("store", store);
  if (q) qs.set("q", q);
  const base = `/admin/coupons${qs.size ? `?${qs}` : ""}`;

  const myStore = session.storeId ? getStore(session.storeId) : null;
  const blocked = looked && session.role === "staff" && session.storeId && looked.useStoreId !== session.storeId
    ? `이 쿠폰은 ${getStore(looked.useStoreId)?.shortName ?? "다른 매장"} 전용이라 ${myStore?.shortName ?? "이 매장"} 계정으로는 사용 처리할 수 없습니다.`
    : null;

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>쿠폰 조회</h1>
          <p className={ui.pageDesc}>손님 화면의 코드 6자리를 넣으면 쿠폰이 나옵니다. 손님이 길게 눌러 직접 사용 처리해도 됩니다.</p>
        </div>
      </div>

      <div className={s.lookup}>
        <form method="get" action="/admin/coupons" className={`${ui.panel} ${ui.panelBody} ${s.codeForm}`}>
          <label className={ui.label} htmlFor="code">
            쿠폰 코드
          </label>
          <CouponCodeInput initial={code} />
          <button type="submit" className={`${ui.button} ${ui.buttonLg}`}>
            조회
          </button>
          <p className={ui.help}>O·0·I·1 처럼 헷갈리는 글자는 코드에 쓰이지 않습니다.</p>
        </form>

        {code.length >= 4 && !looked ? (
          <div className={`${ui.panel} ${ui.panelBody}`}>
            <p className={`${ui.notice} ${ui.noticeBad}`}>
              <b className={ui.mono}>{code}</b> 코드의 쿠폰이 없습니다. 손님 화면의 코드를 다시 확인해 주세요.
            </p>
          </div>
        ) : null}

        {looked ? (
          <div className={`${ui.panel} ${s.card}`} data-store={looked.useStoreId}>
            <div className={s.cardHead}>
              <span className={s.cardStore}>
                <StoreTag id={looked.useStoreId} full />
                <span className={ui.dim}>에서 사용</span>
              </span>
              <CouponBadge status={looked.status} />
            </div>
            <div className={s.cardMenu}>{looked.menuName} 무료</div>
            <div className={s.cardCode}>{looked.code}</div>
            <div className={s.cardBody}>
              <dl className={ui.kv}>
                <dt>종류</dt>
                <dd>{COUPON_KIND[looked.kind] ?? looked.kind}</dd>
                <dt>회원</dt>
                <dd className={ui.mono}>{looked.memberPhone ? maskPhone(looked.memberPhone) : "-"}</dd>
                <dt>발급</dt>
                <dd className={ui.mono}>{fmtDateTime(looked.issuedAt)}</dd>
                <dt>만료</dt>
                <dd className={ui.mono}>{fmtDateTime(looked.expiresAt)}</dd>
                {looked.usedAt ? (
                  <>
                    <dt>사용</dt>
                    <dd className={ui.mono}>
                      {fmtDateTime(looked.usedAt)} <span className={ui.dim}>({looked.usedVia === "customer" ? "손님이 직접" : looked.usedVia ? `관리자 계정 ${looked.usedVia.replace("admin:", "")}` : "-"})</span>
                    </dd>
                  </>
                ) : null}
                {looked.note ? (
                  <>
                    <dt>메모</dt>
                    <dd>{looked.note}</dd>
                  </>
                ) : null}
                {looked.receiptId ? (
                  <>
                    <dt>근거 영수증</dt>
                    <dd>
                      <Link href={`/admin/receipts/${looked.receiptId}`} className={ui.rowLink}>
                        영수증 보기
                      </Link>
                    </dd>
                  </>
                ) : null}
              </dl>
              {looked.status === "active" ? (
                <p className={ui.help}>손님이 {getStore(looked.useStoreId)?.shortName} 테이블에 있고 메뉴가 나갔으면 사용 처리합니다. 처리 후에는 되돌릴 수 없습니다.</p>
              ) : null}
              <CouponActions couponId={looked.id} status={looked.status} canRedeem={looked.status === "active" && !blocked} redeemBlockedReason={blocked} canVoid={session.role === "owner"} />
            </div>
          </div>
        ) : null}
      </div>

      <h2 className={ui.sectionTitle} style={{ marginTop: 24 }}>
        쿠폰 목록{myStore ? ` — ${myStore.shortName}` : ""}
      </h2>
      <form method="get" action="/admin/coupons" className={ui.filterBar}>
        <div className={ui.chips} role="group" aria-label="상태">
          {STATUSES.map((st) => {
            const p = new URLSearchParams(qs);
            if (st.key) p.set("status", st.key);
            else p.delete("status");
            return (
              <Link key={st.key} href={`/admin/coupons${p.size ? `?${p}` : ""}`} className={`${ui.chip} ${(status ?? "") === st.key ? ui.chipActive : ""}`}>
                {st.label}
              </Link>
            );
          })}
        </div>
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {session.role === "owner" ? (
          <select name="store" className={ui.select} defaultValue={store ?? ""} aria-label="사용 매장">
            <option value="">모든 매장</option>
            {STORES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.shortName}
              </option>
            ))}
          </select>
        ) : null}
        <input name="q" className={`${ui.input} ${ui.inputMono}`} placeholder="전화 뒷자리 또는 코드" defaultValue={q} aria-label="검색" />
        <button type="submit" className={`${ui.button} ${ui.buttonGhost}`}>
          검색
        </button>
      </form>
      <div className={ui.panel}>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>코드</th>
                <th>상태</th>
                <th>사용 매장</th>
                <th>메뉴</th>
                <th>종류</th>
                <th>회원</th>
                <th>발급</th>
                <th>만료</th>
                <th>사용</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className={ui.empty}>
                    조건에 맞는 쿠폰이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/coupons?code=${c.code}`} className={`${ui.rowLink} ${ui.mono}`}>
                        {c.code}
                      </Link>
                    </td>
                    <td>
                      <CouponBadge status={c.status} />
                    </td>
                    <td>
                      <StoreTag id={c.useStoreId} />
                    </td>
                    <td>{c.menuName}</td>
                    <td className={ui.dim}>{COUPON_KIND[c.kind] ?? c.kind}</td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{c.memberPhone ? phoneFor(session, c.memberPhone, maskPhone, formatPhone) : "-"}</td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(c.issuedAt, now)}</td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(c.expiresAt, now)}</td>
                    <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(c.usedAt, now)}</td>
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
