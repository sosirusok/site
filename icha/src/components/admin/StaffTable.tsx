"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createStaffAction, resetStaffPasswordAction, setStaffActiveAction, type ActionState } from "@/app/admin/actions";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/staff/staff.module.css";

export type StaffRow = { id: string; name: string; storeId: string | null; storeName: string | null; role: "owner" | "staff"; active: boolean; createdAt: string };

export function StaffTable({ admins, meId }: { admins: StaffRow[]; meId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<ActionState>(null);
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = (a: StaffRow) => {
    if (!a.active || window.confirm(`'${a.id}' 계정을 비활성화할까요? 즉시 로그인이 막힙니다.`)) {
      const fd = new FormData();
      fd.set("id", a.id);
      fd.set("active", a.active ? "0" : "1");
      start(async () => {
        setMsg(await setStaffActiveAction(null, fd));
        router.refresh();
      });
    }
  };
  return (
    <>
      {msg ? (
        <p className={`${ui.notice} ${msg.ok ? ui.noticeOk : ui.noticeBad}`} role="status" style={{ marginBottom: 10 }}>
          {msg.message}
        </p>
      ) : null}
      <div className={ui.panel}>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>아이디</th>
                <th>이름</th>
                <th>역할</th>
                <th>매장</th>
                <th>상태</th>
                <th>만든 날</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className={ui.mono}>
                    {a.id}
                    {a.id === meId ? <span className={s.me}>(나)</span> : null}
                  </td>
                  <td>{a.name}</td>
                  <td>{a.role === "owner" ? "총괄" : "직원"}</td>
                  <td>{a.storeName ?? <span className={ui.dim}>전체</span>}</td>
                  <td>{a.active ? <span className={`${ui.badge} ${ui.badgeOk}`}>사용 중</span> : <span className={ui.badge}>비활성</span>}</td>
                  <td className={`${ui.mono} ${ui.nowrap}`}>{a.createdAt}</td>
                  <td>
                    <div className={ui.inline} style={{ flexWrap: "nowrap" }}>
                      {pwFor === a.id ? (
                        <PasswordForm id={a.id} onDone={(r) => { setMsg(r); if (r?.ok) setPwFor(null); }} onCancel={() => setPwFor(null)} />
                      ) : (
                        <>
                          <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={() => setPwFor(a.id)}>
                            비밀번호 재설정
                          </button>
                          {a.id !== meId ? (
                            <button type="button" className={`${ui.button} ${a.active ? ui.buttonDanger : ui.buttonGhost} ${ui.buttonSm}`} disabled={pending} onClick={() => toggle(a)}>
                              {a.active ? "비활성화" : "다시 활성화"}
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function PasswordForm({ id, onDone, onCancel }: { id: string; onDone: (r: ActionState) => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(resetStaffPasswordAction, null);
  useEffect(() => {
    if (state) onDone(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className={s.pwForm}>
      <input type="hidden" name="id" value={id} />
      <input name="password" type="password" className={`${ui.input}`} placeholder="새 비밀번호 8자 이상" minLength={8} required autoFocus style={{ minHeight: 32 }} />
      <button type="submit" className={`${ui.button} ${ui.buttonSm}`} disabled={pending}>
        {pending ? "…" : "변경"}
      </button>
      <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={onCancel}>
        취소
      </button>
    </form>
  );
}

export function StaffCreateForm({ stores }: { stores: { id: string; shortName: string }[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(createStaffAction, null);
  const [role, setRole] = useState<"staff" | "owner">("staff");
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={action} className={ui.form} key={state?.ok ? state.at : "form"}>
      <div className={ui.formRow}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="sc-id">
            아이디
          </label>
          <input id="sc-id" name="id" className={`${ui.input} ${ui.inputMono}`} placeholder="예: tokyo1" pattern="[a-z0-9_.\-]{3,20}" required autoCapitalize="none" autoComplete="off" />
          <span className={ui.help}>영문 소문자·숫자 3~20자. 나중에 바꿀 수 없습니다.</span>
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="sc-name">
            이름
          </label>
          <input id="sc-name" name="name" className={ui.input} placeholder="예: 김민지" required maxLength={30} />
        </div>
      </div>
      <div className={ui.formRow}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="sc-role">
            역할
          </label>
          <select id="sc-role" name="role" className={ui.select} value={role} onChange={(e) => setRole(e.target.value as "staff" | "owner")}>
            <option value="staff">매장 직원</option>
            <option value="owner">총괄 관리자</option>
          </select>
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="sc-store">
            매장
          </label>
          <select id="sc-store" name="storeId" className={ui.select} disabled={role === "owner"} defaultValue={stores[0]?.id}>
            {stores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.shortName}
              </option>
            ))}
          </select>
          <span className={ui.help}>{role === "owner" ? "총괄은 모든 화면을 볼 수 있고 매장에 매이지 않습니다." : "직원은 영수증 확인과 자기 매장 쿠폰 사용 처리만 할 수 있습니다."}</span>
        </div>
      </div>
      <div className={ui.field}>
        <label className={ui.label} htmlFor="sc-pw">
          처음 비밀번호
        </label>
        <input id="sc-pw" name="password" type="password" className={ui.input} minLength={8} required autoComplete="new-password" />
        <span className={ui.help}>8자 이상. 직원에게 직접 알려 주고, 필요하면 나중에 재설정합니다.</span>
      </div>
      {state ? (
        <p className={`${ui.notice} ${state.ok ? ui.noticeOk : ui.noticeBad}`} role="status">
          {state.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className={ui.button} disabled={pending}>
          {pending ? "만드는 중…" : "계정 만들기"}
        </button>
      </div>
    </form>
  );
}
