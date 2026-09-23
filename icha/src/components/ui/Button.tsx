import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

export type ButtonVariant = "primary" | "naver" | "brand" | "outline" | "soft" | "ghost" | "dark" | "darkline";
export type ButtonSize = "lg" | "md" | "sm" | "xs";

type Props = {
  /** 내부 경로("/…", "#…")는 Link, 바깥 주소는 새 탭 <a>, 없으면 <button> */
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  type?: "button" | "submit";
  disabled?: boolean;
  id?: string;
  /** 읽히는 이름 뒤에만 붙는 말(" — 도쿄스탠드") */
  srSuffix?: string;
  "aria-label"?: string;
  "aria-busy"?: boolean;
  /** 바깥 주소도 같은 탭에서 연다 — 앱스토어처럼 앱으로 넘겨주고 끝나는 주소 */
  sameTab?: boolean;
};

/**
 * 버튼 — 모양은 하나(globals.css .btn), 색만 다르다: primary(라임) · naver(예약, 초록) · brand · outline(네온 테두리) · soft · ghost(밑줄) · dark/darkline(라임 색면 위).
 * 크기 md 48px · lg 52px · sm 40px · xs 34px. block 이면 가로 가득.
 */
export function Button({ href, variant = "primary", size = "md", block = false, className = "", style, children, onClick, type = "button", disabled, id, srSuffix, sameTab, ...rest }: Props) {
  const cls = ["btn", `btn-${variant}`, size !== "md" ? `btn-${size}` : "", block ? "btn-block" : "", className].filter(Boolean).join(" ");
  const inner = (
    <>
      {children}
      {srSuffix && <span className="sr-only">{srSuffix}</span>}
    </>
  );
  const label = rest["aria-label"];
  if (href) {
    if (href.startsWith("/") || href.startsWith("#")) {
      return <Link id={id} href={href} className={cls} style={style} aria-label={label} onClick={onClick}>{inner}</Link>;
    }
    if (href.startsWith("tel:") || href.startsWith("mailto:") || sameTab) {
      return <a id={id} href={href} className={cls} style={style} aria-label={label} onClick={onClick}>{inner}</a>;
    }
    return <a id={id} href={href} className={cls} style={style} aria-label={label} onClick={onClick} target="_blank" rel="noreferrer">{inner}</a>;
  }
  return <button id={id} type={type} className={cls} style={style} aria-label={label} aria-busy={rest["aria-busy"]} onClick={onClick} disabled={disabled}>{inner}</button>;
}
