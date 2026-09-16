/** 손으로 그린 굽은 화살표 — 메모 옆에 붙이는 장식. 흰 선에 검은 테두리. */
export function HandArrow({ className = "", size = 44, flip = false }: { className?: string; size?: number; flip?: boolean }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M6 10c6 14 16 22 32 24m0 0-9-4m9 4-6 8" stroke="#111" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10c6 14 16 22 32 24m0 0-9-4m9 4-6 8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
