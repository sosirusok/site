import Image from "next/image";
import type { StoreId } from "@/lib/config";

/** 실제 유리관 네온 간판 사진(배경 투명). 매장 이름을 글자 대신 이 간판으로 세운다. */
const SIGN: Record<StoreId, { src: string; w: number; h: number }> = {
  tokyo: { src: "/images/neon/sign-tokyo.png", w: 880, h: 199 },
  joseon: { src: "/images/neon/sign-joseon.png", w: 880, h: 216 },
  wareureu: { src: "/images/neon/sign-wareureu.png", w: 880, h: 231 },
};

/**
 * 매장 이름 네온 간판. 화면에 읽히는 이름은 이 사진이고, 스크린 리더와 검색엔진에는
 * 옆에 둔 글자(h1·sr-only)가 간다 — 그래서 alt 는 비운다.
 */
export function StoreSign({ id, className, sizes = "(min-width: 480px) 380px, 80vw", priority = false }: { id: StoreId; className?: string; sizes?: string; priority?: boolean }) {
  const s = SIGN[id];
  return <Image src={s.src} alt="" aria-hidden="true" width={s.w} height={s.h} sizes={sizes} className={className} priority={priority} />;
}
