import Link from "next/link";

/** 화면 아래(탭 위)에 붙는 주요 버튼 — 이벤트 페이지처럼 어디서든 바로 시작할 수 있게 */
export function StickyCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="fixed-col sticky-cta">
      <Link href={href} className="btn btn-block">{children}</Link>
    </div>
  );
}
