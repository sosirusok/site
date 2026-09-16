import Image from "next/image";
import type { CSSProperties } from "react";
import type { StoreId } from "@/lib/config";

/**
 * 사장님 포스터(public/images/event/poster.jpg)에서 오려 낸 조각들.
 * 화면에는 이 조각을 그대로 붙인다 — 다시 그리지 않는다. 글자가 든 조각은 alt 에 그 글자를 그대로 적는다.
 */
export const PIECES = {
  "hero-top": { src: "/images/poster/hero-top.png", w: 1080, h: 320, alt: "알콜부시기 — 소주·맥주·막걸리, 서면 3가게 콜라보, 50m 안에서 즐기는 1차·2차·3차" },
  title: { src: "/images/poster/title-tight.png", w: 690, h: 128, alt: "알콜부시기" },
  "plate-tokyo": { src: "/images/poster/plate-tokyo.png", w: 372, h: 156, alt: "1차 맥주로 시작! 도쿄스탠드 서면" },
  "plate-joseon": { src: "/images/poster/plate-joseon.png", w: 335, h: 158, alt: "2차 막걸리로 이어서! 조선칼국수와 통막걸리 밀리오레점" },
  "plate-wareureu": { src: "/images/poster/plate-wareureu.png", w: 372, h: 156, alt: "3차 소주로 마무리! 와르르맨숀 서면" },
  "benefit-tokyo": { src: "/images/poster/benefit-tokyo.png", w: 255, h: 80, alt: "도쿄스탠드 — 산토리 프리미엄 생맥주" },
  "benefit-joseon": { src: "/images/poster/benefit-joseon.png", w: 255, h: 80, alt: "조선칼국수와 통막걸리 — 2통1반" },
  "benefit-wareureu": { src: "/images/poster/benefit-wareureu.png", w: 258, h: 80, alt: "와르르맨숀 — 요거트 아이스크림 or 소주" },
  "ribbon-event": { src: "/images/poster/ribbon-event.png", w: 740, h: 88, alt: "영수증 릴레이 EVENT" },
  "step-1": { src: "/images/poster/step-1.png", w: 196, h: 84, alt: "1. 한 매장 이용 후 영수증 지참" },
  "step-2": { src: "/images/poster/step-2.png", w: 146, h: 84, alt: "2. 50m 안 다른 매장 방문" },
  "step-3": { src: "/images/poster/step-3.png", w: 136, h: 84, alt: "3. 메인안주 1개 주문 시" },
  "step-4": { src: "/images/poster/step-4.png", w: 214, h: 84, alt: "4. 각 매장별 특별 혜택!" },
  "pill-condition": { src: "/images/poster/pill-condition.png", w: 380, h: 38, alt: "당일 영수증 한정 / 테이블당 1회" },
  "note-good": { src: "/images/poster/note-good.png", w: 130, h: 140, alt: "좋은 술, 좋은 음식, 좋은 사람." },
  "note-again": { src: "/images/poster/note-again.png", w: 185, h: 95, alt: "먹고 마시고 또 가자!" },
  "note-today": { src: "/images/poster/note-today.png", w: 205, h: 100, alt: "오늘 서면에서 알콜부시기!" },
  mug: { src: "/images/poster/mug.png", w: 125, h: 195, alt: "산토리 프리미엄 몰츠 생맥주 한 잔" },
  "footer-line": { src: "/images/poster/footer-line.png", w: 620, h: 36, alt: "GOOD DRINKS GOOD FOOD GOOD PEOPLE in SEOMYEON" },
} as const;

export type PieceName = keyof typeof PIECES;

export function plateOf(id: StoreId): PieceName {
  return `plate-${id}` as PieceName;
}
export function benefitOf(id: StoreId): PieceName {
  return `benefit-${id}` as PieceName;
}

type Props = {
  name: PieceName;
  /** 장식용이면 true — alt 를 비우고 보조기기에서 숨긴다 */
  decorative?: boolean;
  /** 기울기(도). 스티커 변수 --r 로 들어간다 */
  rotate?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  style?: CSSProperties;
  /** 그림자·모서리(스티커) 없이 그림만 */
  bare?: boolean;
};

/** 포스터 조각 한 장 — 기본은 스티커(모서리 6px, 딱딱한 그림자, 기울기) */
export function Piece({ name, decorative = false, rotate, className = "", sizes, priority = false, style, bare = false }: Props) {
  const p = PIECES[name];
  const st: CSSProperties = { ...(rotate != null ? ({ "--r": `${rotate}deg` } as CSSProperties) : {}), ...style };
  return (
    <span className={`${bare ? "" : "stk"} ${className}`} style={st}>
      <Image src={p.src} alt={decorative ? "" : p.alt} aria-hidden={decorative || undefined} width={p.w} height={p.h} sizes={sizes ?? "(min-width: 480px) 480px, 100vw"} priority={priority} draggable={false} />
    </span>
  );
}
