/**
 * 흐름 화면(쿠폰·쿠폰함·고르기·로그인)이 이미지 키트를 쓰는 창구 — 키트 등록부와 스티커 버튼은 src/lib/kit.ts, src/components/site/Kit.tsx 의 것을 그대로 쓴다.
 * 키트 등록부(src/lib/kit-manifest.json, `npm run kit` 가 public/images/kit/ 를 훑어 만든다)에 파일이 있으면 그 이미지를,
 * 없으면 지금의 CSS 스티커 버튼·포스터 조각을 그대로 그린다. 55장 키트가 도착하면 파일명만 맞으면 코드 수정 없이 바뀐다.
 */
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { StickerButton as KitStickerButton, type ButtonKind } from "@/components/site/Kit";
import { kitPiece, type KitEntry } from "@/lib/kit";
import k from "./kit.module.css";

export { KIT_ALT, kitAlt, kitPiece } from "@/lib/kit";
export type KitPiece = KitEntry;
export type StickerKind = ButtonKind;

export type StickerButtonProps = {
  /** 키트 파일 btn-<kind>.png 와 짝. book 만 네이버 초록(가게마다 하나) */
  kind: StickerKind;
  /** "/..." 는 next/link, 바깥 주소는 새 창. 없으면 <button> */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** 한 줄 가득(.btn-block) */
  block?: boolean;
  /** 44px 작은 스티커(.btn-sm) */
  small?: boolean;
  /** 기울기(도) — 기본 -1, 옆에 나란히 둘 때 1, 0 이면 반듯하게 */
  rotate?: -1 | 0 | 1;
  className?: string;
  /** 살아 있는 글자 — 이미지 버튼일 때는 화면에서 숨기고 보조기기에만 읽힌다 */
  children: ReactNode;
  "aria-label"?: string;
  id?: string;
};

/** 스티커 버튼 — 키트에 btn-<kind> 가 있으면 그 그림(52px, 작은 것 44px), 없으면 CSS .btn(.btn-naver 는 book 만). 흐름 화면용 짧은 이름 */
export function StickerButton({ small = false, rotate = -1, ...p }: StickerButtonProps) {
  return <KitStickerButton {...p} size={small ? "sm" : "md"} tilt={rotate} />;
}

/**
 * " · " 로 잇는 정보 줄(규칙·유효기간·조건) — 항목마다 inline-block 이라 줄바꿈은 항목 사이(구분점 뒤 공백)에서만 일어난다.
 * 외자 하나가 다음 줄로 떨어지는 일이 없고, nowrap 이 아니라 항목이 칸보다 길면 그 안에서 접힌다. 문자열 항목은 " · " 로 다시 나눈다.
 */
export function DotLine({ items, className = "" }: { items: ReactNode[]; className?: string }) {
  const list = items.flatMap((it) => (typeof it === "string" ? it.split(" · ").filter(Boolean) : [it]));
  return (
    <span className={className}>
      {list.map((it, i) => (
        <span key={i}><span className={k.dotItem}>{it}{i < list.length - 1 && " ·"}</span>{i < list.length - 1 && " "}</span>
      ))}
    </span>
  );
}

/**
 * 키트의 오려 낸 그림(투명 PNG) 한 장을 정해진 폭으로 — 스티커 그림자 없이 그림만, 장식이라 보조기기에서 감춘다.
 * 키트에 없으면 fallback(없으면 아무것도) 을 그린다. 404 의 쓰러진 소주잔, 빈 쿠폰함의 영수증 꽂이 같은 것.
 */
export function KitCut({ name, width, className = "", fallback = null, style, priority = false }: { name: string; width: number; className?: string; fallback?: ReactNode; style?: CSSProperties; priority?: boolean }) {
  const p = kitPiece(name);
  if (!p) return <>{fallback}</>;
  return (
    <span className={`${k.cut} ${className}`} style={{ width, ...style }} aria-hidden="true" data-piece={name}>
      <Image src={p.src} alt="" width={p.w} height={p.h} sizes={`${width}px`} draggable={false} priority={priority} />
    </span>
  );
}
