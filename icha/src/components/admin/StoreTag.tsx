import ui from "@/app/admin/admin.module.css";
import { getStore } from "@/lib/stores";

/** 매장 색 점 + 짧은 이름 */
export function StoreTag({ id, full = false }: { id: string | null | undefined; full?: boolean }) {
  const s = id ? getStore(id) : null;
  if (!s) return <span className={ui.dim}>매장 미확인</span>;
  return (
    <span className={ui.storeTag} data-store={s.id}>
      <span className={ui.storeDot} aria-hidden="true" />
      {full ? s.name : s.shortName}
    </span>
  );
}
