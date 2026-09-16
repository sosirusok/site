import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPhone, maskPhone, reasonText } from "@/lib/config";
import { getMember, getReceipt, listCouponsForMember } from "@/lib/db/queries";
import type { ReceiptOcr } from "@/lib/receipt/ocr";
import type { MatchResult } from "@/lib/receipt/match";
import { getRules } from "@/lib/settings";
import { STORES, getStore } from "@/lib/stores";
import { requireAdminPage, phoneFor } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { fmtAgo, fmtDateTime, tierName, toLocalInput, won } from "@/components/admin/format";
import { Badge, CouponBadge, ReceiptBadge } from "@/components/admin/Badge";
import { StoreTag } from "@/components/admin/StoreTag";
import { ReceiptViewer } from "@/components/admin/ReceiptViewer";
import { ReceiptDecisionForm } from "@/components/admin/ReceiptDecisionForm";
import ui from "@/app/admin/admin.module.css";
import s from "../receipts.module.css";

export const metadata = { title: "영수증 판정" };

type Ocr = Partial<ReceiptOcr> & { _match?: MatchResult };

const DOC_TYPE: Record<string, string> = {
  card_slip: "카드 매출전표",
  cash_receipt: "현금영수증",
  simple_receipt: "간이 영수증",
  cancel_slip: "취소 전표",
  order_slip: "주문서(빌지)",
  screen_capture: "화면 캡처",
  other: "기타",
};
const PAY: Record<string, string> = { card: "카드", cash: "현금", transfer: "이체", other: "기타", unknown: "미상" };

function Conf({ v, min }: { v: number | undefined; min: number }) {
  if (v == null) return null;
  return <span className={`${s.conf} ${v < min ? s.confLow : ""}`}>{Math.round(v * 100)}%</span>;
}

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const r = await getReceipt(id);
  if (!r) notFound();
  // 직원은 자기 매장 영수증(또는 매장 미확정 건)만 본다
  if (session.role === "staff" && r.storeId && r.storeId !== session.storeId) return <Forbidden what={`${getStore(r.storeId)?.shortName ?? "다른 매장"} 영수증`} />;
  const staffStore = session.role === "staff" ? session.storeId : null;
  const [member, rules, coupons] = await Promise.all([getMember(r.memberId), getRules(), listCouponsForMember(r.memberId)]);
  const ocr = (r.ocr && typeof r.ocr === "object" ? (r.ocr as Ocr) : null);
  const coupon = r.couponId ? coupons.find((c) => c.id === r.couponId) ?? null : null;
  const now = new Date();
  const memberReceiptsHint = member ? `누적 ${won(member.totalSpend)} · ${member.visitCount}회 방문 · ${tierName(member.tier, rules.tiers)}` : "";

  return (
    <>
      <p className={ui.crumb}>
        <Link href="/admin/receipts">영수증 확인</Link> / <span className={ui.mono}>{r.id.slice(0, 8)}</span>
      </p>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <ReceiptBadge status={r.status} />
            <StoreTag id={r.storeId} full />
          </h1>
          <p className={ui.pageDesc}>
            접수 {fmtDateTime(r.createdAt)} ({fmtAgo(r.createdAt, now)})
            {r.reviewedAt ? ` · 판정 ${fmtDateTime(r.reviewedAt)} by ${r.reviewedBy}` : ""}
          </p>
        </div>
      </div>

      <div className={s.detail}>
        <div className={ui.stack}>
          {r.hasImage ? (
            <ReceiptViewer src={`/api/receipts/${r.id}/image?w=1200`} originalHref={`/api/receipts/${r.id}/image`} />
          ) : (
            <div className={`${ui.panel} ${ui.panelBody}`}>
              <p className={`${ui.notice} ${ui.noticeInfo}`}>보관 기간이 지나 원본 사진은 삭제되었습니다. 읽은 값과 판정 기록만 남아 있습니다. (반려 건 7일, 그 외 90일)</p>
            </div>
          )}

          <section className={ui.panel}>
            <div className={ui.panelHead}>
              <h2 className={ui.panelTitle}>회원</h2>
              {member && session.role === "owner" ? (
                <Link href={`/admin/members/${member.id}`} className={ui.linkButton}>
                  회원 상세
                </Link>
              ) : null}
            </div>
            <div className={ui.panelBody}>
              {member ? (
                <dl className={ui.kv}>
                  <dt>전화</dt>
                  <dd className={ui.mono}>{phoneFor(session, member.phone, maskPhone, formatPhone)}</dd>
                  <dt>누적</dt>
                  <dd>{memberReceiptsHint}</dd>
                  <dt>가입</dt>
                  <dd className={ui.mono}>{fmtDateTime(member.createdAt)}</dd>
                  {member.memo ? (
                    <>
                      <dt>메모</dt>
                      <dd>{member.memo}</dd>
                    </>
                  ) : null}
                </dl>
              ) : (
                <p className={ui.dim}>회원 정보를 찾을 수 없습니다.</p>
              )}
              {coupon ? (
                <p className={ui.help} style={{ marginTop: 10 }}>
                  이 영수증으로 발급된 쿠폰: <Link href={`/admin/coupons?code=${coupon.code}`} className={`${ui.mono} ${ui.rowLink}`}>{coupon.code}</Link> · {getStore(coupon.useStoreId)?.shortName} {coupon.menuName} <CouponBadge status={coupon.status} />
                </p>
              ) : r.status === "approved" ? (
                <p className={ui.help} style={{ marginTop: 10 }}>
                  승인됨. 회원이 아직 증정 품목을 고르지 않았습니다.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className={ui.stack}>
          <section className={ui.panel}>
            <div className={ui.panelHead}>
              <h2 className={ui.panelTitle}>판정</h2>
              <span className={ui.panelNote}>{r.status === "review" ? "사진과 읽은 값을 대조한 뒤 결정" : "판정 기록"}</span>
            </div>
            <div className={ui.panelBody}>
              {r.reasons.length ? (
                <ul className={s.reasons} style={{ marginBottom: 14 }}>
                  {r.reasons.map((code) => (
                    <li key={code}>
                      <code>{code}</code>
                      <span>{reasonText(code)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={ui.help} style={{ marginBottom: 14 }}>
                  자동 판정 사유 없음 (자동 승인).
                </p>
              )}
              <ReceiptDecisionForm
                receipt={{ id: r.id, status: r.status, storeId: r.storeId, amount: r.amount, receiptAtLocal: toLocalInput(r.receiptAt), reviewNote: r.reviewNote }}
                stores={STORES.map((st) => ({ id: st.id, shortName: st.shortName }))}
                lockStore={staffStore}
              />
            </div>
          </section>

          <section className={ui.panel}>
            <div className={ui.panelHead}>
              <h2 className={ui.panelTitle}>읽은 값</h2>
              <span className={ui.panelNote}>신뢰도 {Math.round(rules.minConfidence * 100)}% 미만은 빨갛게</span>
            </div>
            <div className={ui.panelBody}>
              {!ocr ? (
                <p className={ui.dim}>자동 인식 결과가 없습니다. 사진만 보고 판단해 주세요.</p>
              ) : (
                <>
                  <dl className={s.readGrid}>
                    <dt>문서 종류</dt>
                    <dd>
                      {DOC_TYPE[ocr.document_type ?? ""] ?? ocr.document_type ?? "-"}
                      {ocr.is_receipt === false ? <span className={ui.dim}> · 영수증 아님</span> : null}
                    </dd>
                    <dt>상호</dt>
                    <dd>
                      {ocr.merchant_name ?? "-"}
                      <Conf v={ocr.confidence?.merchant} min={rules.minConfidence} />
                    </dd>
                    <dt>사업자번호</dt>
                    <dd className={ui.mono}>{ocr.business_number ?? "-"}</dd>
                    <dt>전화</dt>
                    <dd className={ui.mono}>{ocr.merchant_phone ?? "-"}</dd>
                    <dt>주소</dt>
                    <dd>{ocr.merchant_address ?? "-"}</dd>
                    <dt>결제 일시</dt>
                    <dd className={ui.mono}>
                      {ocr.paid_at ?? "-"}
                      <Conf v={ocr.confidence?.paid_at} min={rules.minConfidence} />
                    </dd>
                    <dt>결제 금액</dt>
                    <dd className={ui.mono}>
                      {won(ocr.total_amount ?? null)}
                      <Conf v={ocr.confidence?.total_amount} min={rules.minConfidence} />
                    </dd>
                    <dt>승인번호</dt>
                    <dd className={ui.mono}>
                      {ocr.approval_number ?? "-"}
                      <Conf v={ocr.confidence?.approval_number} min={rules.minConfidence} />
                    </dd>
                    <dt>카드 끝 4자리</dt>
                    <dd className={ui.mono}>{ocr.card_last4 ?? "-"}</dd>
                    <dt>결제 수단</dt>
                    <dd>{PAY[ocr.payment_method ?? ""] ?? "-"}</dd>
                    <dt>매장 판단</dt>
                    <dd>
                      {ocr._match?.storeId ? getStore(ocr._match.storeId)?.shortName : "미확정"}
                      {ocr._match ? <span className={ui.dim}> · 점수 {ocr._match.score}{ocr._match.evidence.length ? ` · ${ocr._match.evidence.join(", ")}` : ""}</span> : null}
                      {ocr.matched_store ? <span className={ui.dim}> · 모델: {ocr.matched_store === "none" ? "없음" : getStore(ocr.matched_store)?.shortName}</span> : null}
                    </dd>
                  </dl>
                  {(ocr.is_reprint || ocr.looks_like_screen_photo || (ocr.quality_notes?.length ?? 0) > 0) ? (
                    <div className={s.flags} style={{ marginTop: 12 }}>
                      {ocr.is_reprint ? <Badge tone="bad">재출력 표시</Badge> : null}
                      {ocr.looks_like_screen_photo ? <Badge tone="bad">화면 촬영 의심</Badge> : null}
                      {ocr.quality_notes?.map((n) => (
                        <Badge key={n} tone="warn">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {ocr.items?.length ? (
                    <>
                      <h3 className={ui.sectionTitle} style={{ marginTop: 14 }}>
                        품목 {ocr.items.length}개
                      </h3>
                      <ul className={s.items}>
                        {ocr.items.map((it, i) => (
                          <li key={`${it.name}-${i}`}>
                            <span>
                              {it.name}
                              {it.qty != null && it.qty > 1 ? <span className={ui.dim}> ×{it.qty}</span> : null}
                            </span>
                            <span className={ui.mono}>{it.amount != null ? won(it.amount) : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {ocr.raw_text ? (
                    <>
                      <h3 className={ui.sectionTitle} style={{ marginTop: 14 }}>
                        인쇄된 글자 그대로
                      </h3>
                      <pre className={ui.pre}>{ocr.raw_text}</pre>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
