/** 둥근 도장. slam=true 면 찍히는 애니메이션 */
export function Stamp({ text, slam = false, color, size = 108, className = "" }: { text: string; slam?: boolean; color?: string; size?: number; className?: string }) {
  return (
    <span
      className={`stamp ${slam ? "slam" : ""} ${className}`}
      style={{ width: size, fontSize: Math.round(size * 0.24), ...(color ? { borderColor: color, color } : {}) }}
      aria-label={text}
      role="img"
    >
      {text}
    </span>
  );
}
