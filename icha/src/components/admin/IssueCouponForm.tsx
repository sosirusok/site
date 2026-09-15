"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { issueCouponsAction, type ActionState } from "@/app/admin/actions";
import ui from "@/app/admin/admin.module.css";

type Gift = { id: number; name: string; price: number | null };

export function IssueCouponForm({
  mode,
  memberId,
  stores,
  gifts,
  tiers,
  defaultDays,
}: {
  mode: "bulk" | "member";
  memberId?: string;
  stores: { id: string; shortName: string }[];
  gifts: Record<string, Gift[]>;
  tiers: { key: string; name: string; minSpend: number }[];
  defaultDays: number;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(issueCouponsAction, null);
  const [targetType, setTargetType] = useState<"tier" | "phone">("tier");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [menuItemId, setMenuItemId] = useState<string>("");
  const options = gifts[storeId] ?? [];
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  useEffect(() => {
    setMenuItemId("");
  }, [storeId]);

  return (
    <form action={action} className={ui.form}>
      <input type="hidden" name="targetType" value={mode === "member" ? "member" : targetType} />
      {mode === "member" ? <input type="hidden" name="memberId" value={memberId} /> : null}

      {mode === "bulk" ? (
        <div className={ui.formRow}>
          <div className={ui.field}>
            <span className={ui.label}>대상</span>
            <div className={ui.inline}>
              <label className={ui.check}>
                <input type="radio" name="_target" checked={targetType === "tier"} onChange={() => setTargetType("tier")} /> 등급 전체
              </label>
              <label className={ui.check}>
                <input type="radio" name="_target" checked={targetType === "phone"} onChange={() => setTargetType("phone")} /> 전화번호 한 명
              </label>
            </div>
          </div>
          {targetType === "tier" ? (
            <div className={ui.field}>
              <label className={ui.label} htmlFor="ic-tier">
                등급
              </label>
              <select id="ic-tier" name="tierKey" className={ui.select} defaultValue={tiers[tiers.length - 1]?.key ?? ""}>
                {tiers.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name} ({t.minSpend.toLocaleString("ko-KR")}원 이상)
                  </option>
                ))}
              </select>
              <span className={ui.help}>해당 등급인 모든 회원에게 한 장씩 갑니다.</span>
            </div>
          ) : (
            <div className={ui.field}>
              <label className={ui.label} htmlFor="ic-phone">
                전화번호
              </label>
              <input id="ic-phone" name="phone" className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" placeholder="010-0000-0000" autoComplete="off" />
              <span className={ui.help}>사이트에 그 번호로 로그인한 적이 있어야 합니다.</span>
            </div>
          )}
        </div>
      ) : null}

      <div className={ui.formRow} style={{ ["--cols" as string]: 3 }}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="ic-store">
            사용 매장
          </label>
          <select id="ic-store" name="useStoreId" className={ui.select} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            {stores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.shortName}
              </option>
            ))}
          </select>
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="ic-menu">
            메뉴
          </label>
          <select id="ic-menu" name="menuItemId" className={ui.select} value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)}>
            <option value="">직접 입력</option>
            {options.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.price != null ? ` · ${g.price.toLocaleString("ko-KR")}원` : ""}
              </option>
            ))}
          </select>
          {options.length === 0 ? <span className={ui.help}>이 매장에 무료 사이드로 표시된 메뉴가 없습니다. 메뉴 화면에서 정하거나 직접 적으세요.</span> : null}
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="ic-name">
            직접 입력 시 메뉴 이름
          </label>
          <input id="ic-name" name="menuName" className={ui.input} placeholder="예: 사이드 한 접시" disabled={menuItemId !== ""} maxLength={40} />
        </div>
      </div>

      <div className={ui.formRow}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="ic-days">
            유효 기간(일)
          </label>
          <input id="ic-days" name="validDays" type="number" min={1} max={365} className={`${ui.input} ${ui.inputMono}`} defaultValue={defaultDays} />
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="ic-note">
            메모
          </label>
          <input id="ic-note" name="note" className={ui.input} placeholder="예: 추석 감사 / 대기 시간 사과" maxLength={100} />
        </div>
      </div>

      {state ? (
        <p className={`${ui.notice} ${state.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className={ui.button} disabled={pending}>
          {pending ? "발급 중…" : mode === "member" ? "이 회원에게 발급" : "발급"}
        </button>
      </div>
    </form>
  );
}
