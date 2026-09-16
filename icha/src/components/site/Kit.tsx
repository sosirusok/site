import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { kitAlt, kitPiece } from "@/lib/kit";
import s from "./Kit.module.css";

/*
 * 키트가 있으면 그림, 없으면 지금의 CSS — 화면 부품 넷.
 *   <StickerButton kind="book">예약하기</StickerButton>   btn-<kind>.png 또는 .btn/.btn-naver
 *   <SectionLabel kind="menu" color="yellow">메뉴</SectionLabel>   label-<kind>.png 또는 .plate
 *   <TabIcon kind="home" fallback={<svg/>} />             icon-<kind>.png 또는 인라인 SVG
 *   <KitPiece name="note-phone" fallback={...} />          키트에만 있는 그림(없으면 fallback 또는 아무것도 안 그림)
 *   <KitDivider name="sign-wareureu" />                    가늘고 긴 장식 선(가운데, 60% 폭, 장식)
 * 파일이 public/images/kit/ 에 들어오고 npm run kit 을 돌리면 코드 수정 없이 바뀐다.
 */

export type ButtonKind = "book" | "wallet" | "use" | "pick" | "get" | "search" | "review" | "login" | "close" | "directions";

type ButtonProps = {
  kind: ButtonKind;
  /** 있으면 링크(내부 "/..." 는 next/link, 바깥 주소는 새 창), 없으면 <button> */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** 작은 스티커(44px) */
  size?: "md" | "sm";
  /** 한 줄 가득 */
  block?: boolean;
  /** 기울기: 왼쪽으로(-1도, 기본) / 없음 / 오른쪽으로(1도) */
  tilt?: -1 | 0 | 1;
  /** 크림색 보조 스티커(예: 닫기) — 키트가 없을 때만 뜻이 있다 */
  secondary?: boolean;
  className?: string;
  style?: CSSProperties;
  /** 살아 있는 글자(키트 그림일 때는 sr-only 로 읽힌다) */
  children: ReactNode;
  "aria-label"?: string;
  id?: string;
};

/**
 * 스티커 버튼 — 키트 btn-<kind> 가 있으면 그 그림(높이 52px·작은 것 44px, 딱딱한 그림자), 없으면 지금의 노란 .btn.
 * 초록(btn-naver)은 kind="book" 뿐이다 — 가게마다 "예약하기" 하나.
 */
export function StickerButton({ kind, href, onClick, type = "button", disabled, size = "md", block = false, tilt = -1, secondary = false, className = "", style, children, id, ...rest }: ButtonProps) {
  const k = kitPiece(`btn-${kind}`);
  const label = rest["aria-label"];
  const tiltStyle = tilt === -1 ? {} : ({ "--r": `${tilt}deg` } as CSSProperties);
  let cls: string;
  let inner: ReactNode;
  if (k) {
    cls = [s.kbtn, size === "sm" ? s.sm : "", block ? s.block : "", className].filter(Boolean).join(" ");
    inner = (
      <>
        <Image src={k.src} alt="" aria-hidden="true" width={k.w} height={k.h} sizes={block ? "300px" : size === "sm" ? "160px" : "240px"} draggable={false} className={s.kbtnImg} />
        <span className="sr-only">{children}</span>
      </>
    );
  } else {
    cls = ["btn", kind === "book" ? "btn-naver" : "", secondary ? "btn-secondary" : "", size === "sm" ? "btn-sm" : "", block ? "btn-block" : "", tilt === 1 ? "btn-r" : tilt === 0 ? "btn-0" : "", className].filter(Boolean).join(" ");
    inner = children;
  }
  const st = { ...tiltStyle, ...style };
  if (href) {
    if (href.startsWith("/")) {
      return <Link id={id} href={href} className={cls} style={st} aria-label={label} onClick={onClick}>{inner}</Link>;
    }
    return <a id={id} href={href} className={cls} style={st} aria-label={label} target="_blank" rel="noreferrer" onClick={onClick}>{inner}</a>;
  }
  return <button id={id} type={type} className={cls} style={st} aria-label={label} onClick={onClick} disabled={disabled}>{inner}</button>;
}

export type LabelKind = "benefit" | "menu" | "map" | "review" | "howto" | "faq" | "wallet" | "guide";
type PlateColor = "blue" | "red" | "green" | "yellow" | "cream" | "store";

type LabelProps = {
  kind: LabelKind;
  /** 키트가 없을 때 .plate 색 */
  color?: PlateColor;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  id?: string;
  className?: string;
  /** 큰 제목(h1) — 키트 그림 높이 56px, 판 글자 30px */
  big?: boolean;
  style?: CSSProperties;
  /** 살아 있는 글자 — 키트 그림일 때는 그림에 적힌 글자(KIT_ALT)가 alt 가 되고, 그게 비어 있으면 이 글자를 sr-only 로 둔다 */
  children: ReactNode;
};

/** 섹션 제목 — 키트 label-<kind> 가 있으면 그 그림, 없으면 색 간판(.plate) */
export function SectionLabel({ kind, color = "red", as: Tag = "h2", id, className = "", big = false, style, children }: LabelProps) {
  const name = `label-${kind}`;
  const k = kitPiece(name);
  if (!k) {
    return <Tag id={id} className={`plate plate-${color} ${big ? s.plateBig : ""} ${className}`} style={style}>{children}</Tag>;
  }
  const alt = kitAlt(name);
  return (
    <Tag id={id} className={`${s.klabel} ${big ? s.klabelBig : ""} ${className}`} style={style}>
      <Image src={k.src} alt={alt} width={k.w} height={k.h} sizes={big ? "240px" : "200px"} draggable={false} className={s.klabelImg} />
      {!alt && <span className="sr-only">{children}</span>}
    </Tag>
  );
}

export type TabIconKind = "home" | "wallet" | "place" | "info";

/** 탭 아이콘 24px — 키트 icon-<kind> 가 있으면 그 그림, 없으면 fallback(인라인 SVG). 글자는 옆에 따로 있으니 장식 */
export function TabIcon({ kind, fallback }: { kind: TabIconKind; fallback: ReactNode }) {
  const k = kitPiece(`icon-${kind}`);
  if (!k) return <>{fallback}</>;
  return <Image src={k.src} alt="" aria-hidden="true" width={24} height={24} sizes="24px" draggable={false} className={s.tabIcon} />;
}

type KitPieceProps = {
  /** 키트 파일 이름(확장자 없이) */
  name: string;
  /** 키트에 없을 때 대신 그릴 것(없으면 아무것도 안 그린다) */
  fallback?: ReactNode;
  /** 장식이면 true — alt 를 비우고 감춘다 */
  decorative?: boolean;
  rotate?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  style?: CSSProperties;
  /** 스티커 그림자 없이 그림만 */
  bare?: boolean;
};

/** 키트에만 있는 그림 한 장(note-phone, cut-*, stamp-*, …) — 투명 PNG 라 그림자는 모양을 따라간다(drop-shadow) */
export function KitPiece({ name, fallback = null, decorative = false, rotate, className = "", sizes, priority = false, style, bare = false }: KitPieceProps) {
  const k = kitPiece(name);
  if (!k) return <>{fallback}</>;
  const alt = decorative ? "" : kitAlt(name);
  const st: CSSProperties = { ...(rotate != null ? ({ "--r": `${rotate}deg` } as CSSProperties) : {}), ...style };
  return (
    <span className={`${bare ? "" : "stk stk-kit"} ${className}`} style={st} data-piece={name}>
      <Image src={k.src} alt={alt} aria-hidden={alt === "" || undefined} width={k.w} height={k.h} sizes={sizes ?? "(min-width: 480px) 480px, 100vw"} priority={priority} draggable={false} />
    </span>
  );
}

/** 가늘고 긴 장식 선(sign-*) — 가운데, 최대 60% 폭, 장식이라 감춘다. 키트에 없으면 아무것도 안 그린다 */
export function KitDivider({ name, className = "" }: { name: string; className?: string }) {
  const k = kitPiece(name);
  if (!k) return null;
  return (
    <span className={`${s.divider} ${className}`} aria-hidden="true" data-piece={name}>
      <Image src={k.src} alt="" width={k.w} height={k.h} sizes="240px" draggable={false} />
    </span>
  );
}
