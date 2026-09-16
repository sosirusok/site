import Image from "next/image";
import type { CSSProperties } from "react";
import { fmtMD } from "./format";
import { kitPiece } from "./kit";
import type { TicketData } from "./PaperTicket";
import s from "./NeonTicket.module.css";

export type TicketSize = "md" | "lg";

export type TicketProps = { t: TicketData; size?: TicketSize; rotate?: number; dim?: boolean; className?: string };

/**
 * 네온 쿠폰 — 키트의 ticket-<매장>.png(880x290, 어두운 티켓에 그 집 색 네온 외곽선, 오른쪽 1/4 에 술 실루엣) 위에
 * 왼쪽 3/4 에 살아 있는 글자를 얹는다: 매장(작게) → 품목(크게) → 코드(그 집 네온색, 자간) → 기한 · 조건(Pretendard).
 * 글자에는 빛을 두르지 않는다 — 네온은 티켓 테두리뿐. 글자 크기는 티켓 폭(cqw)에 붙어 있어 그림에 박힌 것처럼 같이 줄어든다.
 * 쓴/지난 쿠폰은 55% 로 흐리게(dim), 도장은 부모가 얹는다. 키트에 그림이 없으면 null — Ticket 이 종이 쿠폰으로 넘긴다.
 */
export function NeonTicket({ t, size = "md", rotate = 0, dim = false, className = "" }: TicketProps) {
  const bg = kitPiece(`ticket-${t.storeId}`);
  if (!bg) return null;
  return (
    <div className={`${s.wrap} ${size === "lg" ? s.lg : s.md} ${dim ? s.dim : ""} ${className}`} style={{ "--r": `${rotate}deg` } as CSSProperties} data-store={t.storeId}>
      <Image src={bg.src} alt="" width={bg.w} height={bg.h} sizes="(min-width: 480px) 448px, calc(100vw - 32px)" className={s.img} draggable={false} priority={size === "lg"} />
      <div className={s.text}>
        <p className={`disp ${s.store}`}>
          {t.storeName}
          {t.kindLabel && <span className={s.kind}> · {t.kindLabel}</span>}
        </p>
        <p className={`disp ${s.name}`}>{t.menuName}</p>
        <p className={`mono ${s.code}`} aria-label={`쿠폰 코드 ${t.code.split("").join(" ")}`}>{t.code}</p>
        <p className={s.meta}>{fmtMD(t.expiresAt)}까지 · 메인안주 1개 주문 시</p>
      </div>
    </div>
  );
}
