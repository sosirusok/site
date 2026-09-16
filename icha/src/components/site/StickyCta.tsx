import Link from "next/link";

/** 화면 아래(탭 위)에 떠 있는 스티커 하나 — 링크 또는 임의 내용. 판 없이 스티커만 뜬다. */
export function StickyCta({ href, children, naver = false }: { href?: string; children: React.ReactNode; naver?: boolean }) {
  return (
    <div className="fixed-col sticky-cta">
      {href ? <Link href={href} className={`btn btn-block ${naver ? "btn-naver" : ""}`}>{children}</Link> : children}
    </div>
  );
}
