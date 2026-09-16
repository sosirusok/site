import Link from "next/link";

/** 화면 아래(탭 위)에 붙는 주요 버튼 — 링크 또는 임의 내용(예: PlaceButton) */
export function StickyCta({ href, children, naver = false }: { href?: string; children: React.ReactNode; naver?: boolean }) {
  return (
    <div className="fixed-col sticky-cta">
      {href ? <Link href={href} className={`btn btn-block ${naver ? "btn-naver" : ""}`}>{children}</Link> : children}
    </div>
  );
}
