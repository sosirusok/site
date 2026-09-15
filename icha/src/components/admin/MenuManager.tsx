"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { deleteMenuAction, moveMenuAction, saveMenuAction, toggleMenuActiveAction, toggleMenuGiftAction, type ActionState } from "@/app/admin/actions";
import type { MenuItem } from "@/lib/db/queries";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/menus/menus.module.css";

type Editing = { kind: "new" } | { kind: "edit"; item: MenuItem } | null;

export function MenuManager({ storeId, storeName, items }: { storeId: string; storeName: string; items: MenuItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);
  const [msg, setMsg] = useState<ActionState>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const call = (fn: (p: ActionState, fd: FormData) => Promise<ActionState>, fd: FormData, id: number) => {
    setBusyId(id);
    start(async () => {
      const r = await fn(null, fd);
      setMsg(r);
      setBusyId(null);
      router.refresh();
    });
  };
  const fdOf = (pairs: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(pairs)) fd.set(k, v);
    return fd;
  };

  const gifts = items.filter((m) => m.isGift && m.active).length;
  const hidden = items.filter((m) => !m.active).length;

  return (
    <>
      <div className={s.summary}>
        <span>
          메뉴 <b>{items.length}</b>개
        </span>
        <span>
          무료 사이드 <b>{gifts}</b>개
        </span>
        {hidden ? (
          <span>
            숨김 <b>{hidden}</b>개
          </span>
        ) : null}
        <span style={{ flex: 1 }} />
        <button type="button" className={`${ui.button} ${ui.buttonSm}`} onClick={() => setEditing({ kind: "new" })} disabled={editing?.kind === "new"}>
          메뉴 추가
        </button>
      </div>
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
                <th style={{ width: 56 }}>사진</th>
                <th>이름</th>
                <th className={ui.right}>가격</th>
                <th>설명</th>
                <th>무료 사이드</th>
                <th>노출</th>
                <th>순서</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {editing?.kind === "new" ? (
                <tr className={s.editRow}>
                  <td colSpan={8}>
                    <MenuEditForm storeId={storeId} item={null} onDone={() => { setEditing(null); router.refresh(); }} onCancel={() => setEditing(null)} onMessage={setMsg} />
                  </td>
                </tr>
              ) : null}
              {items.length === 0 && editing?.kind !== "new" ? (
                <tr>
                  <td colSpan={8} className={ui.empty}>
                    {storeName}에 등록된 메뉴가 없습니다. 위의 "메뉴 추가"로 넣어 주세요.
                  </td>
                </tr>
              ) : null}
              {items.map((m, i) =>
                editing?.kind === "edit" && editing.item.id === m.id ? (
                  <tr key={m.id} className={s.editRow}>
                    <td colSpan={8}>
                      <MenuEditForm storeId={storeId} item={m} onDone={() => { setEditing(null); router.refresh(); }} onCancel={() => setEditing(null)} onMessage={setMsg} />
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id} className={m.active ? "" : s.rowInactive}>
                    <td>
                      {m.hasImageData ? (
                        <img src={`/api/menu-image/${m.id}`} alt="" className={s.thumb} loading="lazy" />
                      ) : m.imagePath ? (
                        <Image src={m.imagePath} alt="" width={48} height={48} className={s.thumb} sizes="48px" />
                      ) : (
                        <span className={s.noThumb} aria-label="사진 없음">
                          없음
                        </span>
                      )}
                    </td>
                    <td className={s.name} style={{ fontWeight: 600 }}>
                      {m.name}
                    </td>
                    <td className={ui.num}>{m.price != null ? `${m.price.toLocaleString("ko-KR")}원` : "-"}</td>
                    <td>
                      <div className={s.desc} title={m.description ?? ""}>
                        {m.description ?? ""}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${s.giftBtn} ${m.isGift ? s.giftOn : ""}`}
                        aria-pressed={m.isGift}
                        disabled={pending && busyId === m.id}
                        onClick={() => call(toggleMenuGiftAction, fdOf({ id: String(m.id) }), m.id)}
                        title={m.isGift ? "누르면 무료 사이드에서 뺍니다" : "누르면 무료 사이드로 넣습니다"}
                      >
                        {m.isGift ? "무료 사이드" : "해당 없음"}
                      </button>
                    </td>
                    <td>
                      <button type="button" className={ui.linkButton} disabled={pending && busyId === m.id} onClick={() => call(toggleMenuActiveAction, fdOf({ id: String(m.id) }), m.id)}>
                        {m.active ? "노출 중" : "숨김"}
                      </button>
                    </td>
                    <td>
                      <div className={s.rowActions}>
                        <button type="button" className={s.iconBtn} aria-label="위로" disabled={i === 0 || pending} onClick={() => call(moveMenuAction, fdOf({ id: String(m.id), dir: "up" }), m.id)}>
                          ↑
                        </button>
                        <button type="button" className={s.iconBtn} aria-label="아래로" disabled={i === items.length - 1 || pending} onClick={() => call(moveMenuAction, fdOf({ id: String(m.id), dir: "down" }), m.id)}>
                          ↓
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className={s.rowActions}>
                        <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={() => setEditing({ kind: "edit", item: m })}>
                          수정
                        </button>
                        <button
                          type="button"
                          className={`${ui.button} ${ui.buttonDanger} ${ui.buttonSm}`}
                          disabled={pending && busyId === m.id}
                          onClick={() => {
                            if (window.confirm(`'${m.name}' 을(를) 삭제할까요? 발급된 쿠폰이 있으면 삭제 대신 숨김 처리됩니다.`)) call(deleteMenuAction, fdOf({ id: String(m.id) }), m.id);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MenuEditForm({ storeId, item, onDone, onCancel, onMessage }: { storeId: string; item: MenuItem | null; onDone: () => void; onCancel: () => void; onMessage: (m: ActionState) => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveMenuAction, null);
  useEffect(() => {
    if (!state) return;
    onMessage(state);
    if (state.ok) onDone();
    // onDone/onMessage 는 안정적인 setState 래퍼
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className={s.editForm}>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="storeId" value={storeId} />
      <div className={s.editGrid}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="me-name">
            이름
          </label>
          <input id="me-name" name="name" className={ui.input} defaultValue={item?.name ?? ""} required maxLength={60} autoFocus />
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="me-price">
            가격(원)
          </label>
          <input id="me-price" name="price" className={`${ui.input} ${ui.inputMono}`} inputMode="numeric" defaultValue={item?.price ?? ""} placeholder="비우면 표시 안 함" />
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor="me-desc">
            설명 (손님에게 보임)
          </label>
          <input id="me-desc" name="description" className={ui.input} defaultValue={item?.description ?? ""} maxLength={300} placeholder="예: 묵은지로 부친 전. 통막걸리와 같이 나가는 기본 안주." />
        </div>
      </div>
      <div className={s.editBtns}>
        <label className={ui.check}>
          <input type="checkbox" name="isGift" defaultChecked={item?.isGift ?? false} /> 무료 사이드로 고를 수 있음
        </label>
        <label className={ui.check}>
          <input type="checkbox" name="active" value="on" defaultChecked={item?.active ?? true} /> 손님 화면에 노출
        </label>
        {!item || !(item.active ?? true) ? <input type="hidden" name="active" value="off" /> : null}
      </div>
      <div className={s.editBtns}>
        <label className={ui.field} style={{ flex: "1 1 260px" }}>
          <span className={ui.label}>사진 {item?.hasImageData ? "(바꾸려면 새 파일 선택)" : ""}</span>
          <input type="file" name="image" accept="image/*" className={ui.input} style={{ padding: "7px 10px" }} />
          <span className={ui.help}>긴 변 900px 로 줄여 저장합니다.</span>
        </label>
        {item?.hasImageData ? (
          <label className={ui.check}>
            <input type="checkbox" name="removeImage" /> 사진 지우기
          </label>
        ) : null}
      </div>
      {state && !state.ok ? (
        <p className={`${ui.notice} ${ui.noticeBad}`} role="alert">
          {state.message}
        </p>
      ) : null}
      <div className={s.editBtns}>
        <button type="submit" className={ui.button} disabled={pending}>
          {pending ? "저장 중…" : item ? "저장" : "추가"}
        </button>
        <button type="button" className={`${ui.button} ${ui.buttonGhost}`} onClick={onCancel} disabled={pending}>
          취소
        </button>
      </div>
    </form>
  );
}
