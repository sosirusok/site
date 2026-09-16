import Link from "next/link";
import ui from "@/app/admin/admin.module.css";

/** 오프셋 기반 페이지 이동. 현재 검색 조건은 base 에 이미 들어 있다. */
export function Pager({ total, page, size, base }: { total: number; page: number; size: number; base: string }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return <p className={ui.pager}>총 {total.toLocaleString("ko-KR")}건</p>;
  const link = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  return (
    <nav className={ui.pager} aria-label="페이지">
      <span>
        총 {total.toLocaleString("ko-KR")}건 · {page}/{pages} 페이지
      </span>
      {page > 1 ? <Link href={link(page - 1)}>이전</Link> : null}
      {page < pages ? <Link href={link(page + 1)}>다음</Link> : null}
    </nav>
  );
}
