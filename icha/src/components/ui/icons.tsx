/** 손으로 그린 선 아이콘 — 세 가지 술과 몇 가지 기본 아이콘. 24x24, 1.6px 선. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number, p: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

/** 막걸리 사발 */
export function MakgeolliIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M4 9.5h16c-.4 5-3 8.5-8 8.5s-7.6-3.5-8-8.5Z" />
      <path d="M6.5 9.5c1.2-1 3.2-1.6 5.5-1.6s4.3.6 5.5 1.6" />
      <path d="M9 18v2h6v-2" />
      <path d="M8.5 12.2c1 .6 2.2.9 3.5.9s2.5-.3 3.5-.9" strokeDasharray="1 2.2" />
    </svg>
  );
}

/** 맥주잔 */
export function BeerIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M6 8.5h10v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-11Z" />
      <path d="M16 11h2.2a1.3 1.3 0 0 1 1.3 1.3v3.4a1.3 1.3 0 0 1-1.3 1.3H16" />
      <path d="M5.5 8.5c0-2 1.2-3.2 2.6-3.2.4-1.5 1.7-2.3 3.2-2.3 1.7 0 2.8.9 3.3 2.1 1.7-.2 2.9 1 2.9 2.6 0 .3 0 .6-.1.8" />
      <path d="M9 12v5M12.5 12v5" strokeOpacity=".6" />
    </svg>
  );
}

/** 소주병 */
export function SojuIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M10 2.5h4v3.2c0 .6.2 1.1.5 1.5l1.2 1.5c.5.6.8 1.4.8 2.2v8.6a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5v-8.6c0-.8.3-1.6.8-2.2l1.2-1.5c.3-.4.5-.9.5-1.5V2.5Z" />
      <path d="M10 2.5h4" />
      <path d="M8.5 12h7v4.5h-7z" strokeOpacity=".7" />
    </svg>
  );
}

export function ReceiptIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4v-17Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </svg>
  );
}

export function StampIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M9 4.5a3 3 0 1 1 6 0c0 2-1.2 3-1.2 5h-3.6c0-2-1.2-3-1.2-5Z" />
      <path d="M5.5 13.5h13v3h-13z" />
      <path d="M7 16.5v3h10v-3" />
      <path d="M9 9.5h6l1.5 4h-9z" />
    </svg>
  );
}

export function TicketIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M3.5 8.5v-2h17v2a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4v2h-17v-2a2 2 0 0 0 0-4v-2a2 2 0 0 0 0-4Z" />
      <path d="M9.5 6.5v14" strokeDasharray="2 2.4" />
    </svg>
  );
}

export function PinIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function ArrowIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function ClockIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function PhoneIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M7.5 3.5h9a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
      <path d="M10.5 17.5h3" />
    </svg>
  );
}

export function CameraIcon({ size = 24, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M4 8.5h3.2l1.3-2.5h7l1.3 2.5H20v10.5H4z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

export function DrinkIcon({ drink, size = 24, ...p }: P & { drink: "막걸리" | "맥주" | "소주" }) {
  if (drink === "막걸리") return <MakgeolliIcon size={size} {...p} />;
  if (drink === "맥주") return <BeerIcon size={size} {...p} />;
  return <SojuIcon size={size} {...p} />;
}
