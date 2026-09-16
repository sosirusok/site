import Link from "next/link";
import { formatPhone, normalizePhone } from "@/lib/config";
import { counterState } from "@/lib/counter";
import { listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES, getStore, giftStoresFor } from "@/lib/stores";
import { requireAdminPage } from "@/components/admin/guard";
import { COUPON_KIND, fmtDateTime, fmtShort } from "@/components/admin/format";
import { CouponBadge } from "@/components/admin/Badge";
import { StoreTag } from "@/components/admin/StoreTag";
import { CounterPhoneForm } from "@/components/admin/CounterPhoneForm";
import { CounterActions } from "@/components/admin/CounterActions";
import ui from "@/app/admin/admin.module.css";
import s from "./counter.module.css";

export const metadata = { title: "카운터" };

/**
 * 계산대 화면. 번호 조회 → (a) 이 손님에게 쿠폰 주기 / (b) 여기서 사용 처리.
 * 직원은 자기 매장, 총괄은 위 칩에서 매장을 고른다.
 */
export default async function CounterPage({ searchParams }: { searchParams: Promise<{ phone?: string; store?: string }> }) {
  const session = await requireAdminPage();
  const sp = await searchParams;
  const owner = session.role === "owner";
  const store = owner ? (STORES.find((x) => x.id === sp.store) ?? STORES[0]!) : session.storeId ? getStore(session.storeId) : null;
  const now = new Date();

  if (!store) {
    return (
      <>
        <div className={ui.pageHead}>
          <h1 className={ui.pageTitle}>카운터</h1>
        </div>
        <p className={`${ui.notice} ${ui.noticeBad}`}>이 직원 계정에는 매장이 지정되어 있지 않습니다. 총괄 관리자에게 문의하세요.</p>
      </>
    );
  }

  const raw = (sp.phone ?? "").trim();
  const phone = raw ? normalizePhone(raw) : null;
  const [rules, gifts, state] = await Promise.all([getRules(), listMenu(store.id, { giftOnly: true }), phone ? counterState(phone, store.id) : Promise.resolve(null)]);
  const usableAtNames = giftStoresFor(store.id)
    .map((x) => x.shortName)
    .join("·");

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>카운터</h1>
          <p className={ui.pageDesc}>손님 번호를 넣고 조회하면 두 가지만 하면 됩니다 — 쿠폰 주기, 사용 처리.</p>
        </div>
      </div>

      {owner ? (
        <div className={s.storeChips} role="group" aria-label="계산대 매장">
          {STORES.map((st) => (
            <Link key={st.id} href={`/admin/counter?store=${st.id}${phone ? `&phone=${phone}` : ""}`} data-store={st.id} className={`${s.storeChip} ${st.id === store.id ? s.storeChipActive : ""}`} aria-current={st.id === store.id ? "true" : undefined}>
              <span className={ui.storeDot} aria-hidden="true" />
              {st.shortName}
            </Link>
          ))}
        </div>
      ) : (
        <p className={s.storeFixed} data-store={store.id}>
          <span className={ui.storeDot} aria-hidden="true" />
          <b>{store.shortName}</b> 계산대
        </p>
      )}

      <section className={`${ui.panel} ${ui.panelBody}`}>
        <CounterPhoneForm initial={phone ?? ""} storeId={owner ? store.id : null} />
        {raw && !phone ? (
          <p className={`${ui.notice} ${ui.noticeBad}`} style={{ marginTop: 10 }} role="alert">
            휴대폰 번호 형식이 아닙니다. 010으로 시작하는 10~11자리를 넣어 주세요.
          </p>
        ) : null}
      </section>

      {phone && state ? (
        <div className={ui.stack} style={{ marginTop: 16 }}>
          <section className={`${ui.panel} ${ui.panelBody} ${s.card}`}>
            <div className={s.cardPhone}>{formatPhone(phone)}</div>
            {state.member ? (
              <p className={s.cardMeta}>
                <span>
                  가입 <b>{fmtDateTime(state.member.createdAt)}</b>
                </span>
                <span>
                  릴레이 <b>{state.member.visitCount}회</b>
                </span>
                {state.member.memo ? <span>메모 · {state.member.memo}</span> : null}
              </p>
            ) : (
              <p className={s.cardMeta}>
                <span>처음 오는 번호입니다. 쿠폰 주기를 누르면 바로 만들어집니다.</span>
              </p>
            )}
            <div className={s.counts}>
              <div className={`${s.count} ${state.pending.length ? s.countHot : ""}`}>
                <span className={s.countLabel}>받은 릴레이</span>
                <span className={s.countValue}>{state.pending.length}</span>
              </div>
              <div className={`${s.count} ${state.usableHere.length ? s.countHot : ""}`}>
                <span className={s.countLabel}>여기서 쓸 쿠폰</span>
                <span className={s.countValue}>{state.usableHere.length}</span>
              </div>
            </div>
          </section>

          <CounterActions
            phone={phone}
            storeId={store.id}
            storeName={store.shortName}
            memberId={state.member?.id ?? null}
            eventActive={rules.eventActive}
            usableAtNames={usableAtNames}
            usable={state.usableHere.map((c) => ({ id: c.id, code: c.code, menuName: c.menuName, expires: fmtShort(c.expiresAt, now), kindLabel: COUPON_KIND[c.kind] ?? c.kind }))}
            pending={state.pending.map((r) => ({ id: r.id, storeName: getStore(r.storeId ?? "")?.shortName ?? "매장", when: fmtShort(r.createdAt, now) }))}
            gifts={gifts.map((g) => ({ id: g.id, name: g.name, price: g.price }))}
          />

          {state.recent.length > 0 ? (
            <section className={ui.panel}>
              <div className={ui.panelHead}>
                <h2 className={ui.panelTitle}>최근 이력</h2>
                {state.member && owner ? (
                  <Link href={`/admin/members/${state.member.id}`} className={ui.linkButton}>
                    회원 상세
                  </Link>
                ) : null}
              </div>
              <div className={ui.tableWrap}>
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>매장 · 혜택</th>
                      <th>종류</th>
                      <th>시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.recent.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <CouponBadge status={c.status} />
                        </td>
                        <td>
                          <StoreTag id={c.useStoreId} /> {c.menuName}
                        </td>
                        <td className={ui.dim}>{COUPON_KIND[c.kind] ?? c.kind}</td>
                        <td className={`${ui.mono} ${ui.nowrap}`}>{fmtShort(c.usedAt ?? c.issuedAt, now)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
