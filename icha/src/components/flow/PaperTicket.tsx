import Image from "next/image";
import type { CSSProperties } from "react";
import type { StoreId } from "@/lib/config";
import { fmtMD } from "./format";
import type { KitPiece } from "./kit";
import s from "./PaperTicket.module.css";

export type TicketData = {
  storeId: StoreId;
  storeName: string;
  menuName: string;
  code: string;
  expiresAt: string;
  /** 품목 사진 — local 이면 /public 정적 파일(next/image 최적화), 아니면 DB 사진 주소 */
  image?: { src: string; local: boolean } | null;
  /** 계산할 때 받은 쿠폰은 없음, 매장이 따로 넣어 준 쿠폰만 "매장 쿠폰" */
  kindLabel?: string | null;
};

/** 사진이 없는 반쪽에 세로로 쌓는 이벤트 이름 — 글자를 하나씩 따로 놓는다(writing-mode 없이) */
const STUB_LABEL = "알콜부시기";

/**
 * 크림 종이 쿠폰 한 장 — 오른쪽에 점선으로 뜯는 반쪽(사진 또는 이벤트 이름), 위아래 구멍, 코드는 Do Hyeon.
 * md 는 쿠폰함 목록, lg 는 쿠폰 화면.
 * bg 가 있으면(키트의 ticket.png, 크림 종이 티켓 그림) CSS 로 그리던 종이·구멍·점선 대신 그 그림을 깔고 글자와 반쪽만 얹는다.
 * 그림 안 자리는 왼쪽 6~68% 가 글자, 오른쪽 74~96% 가 반쪽 — 파일이 오면 PaperTicket.module.css 의 .kitMain/.kitStub 만 맞춘다.
 */
export function PaperTicket({ t, size = "md", rotate = 0, dim = false, className = "", bg = null }: { t: TicketData; size?: "md" | "lg"; rotate?: number; dim?: boolean; className?: string; bg?: KitPiece | null }) {
  const cut = t.image?.local && /\.png$/i.test(t.image.src);
  const main = (
    <>
      <p className={s.store}><span className="plate plate-store plate-sm">{t.storeName}</span>{t.kindLabel && <span className="tag">{t.kindLabel}</span>}</p>
      <p className={`disp ${s.name}`}>{t.menuName}</p>
      <p className={`mono ${s.code}`} aria-label={`쿠폰 코드 ${t.code.split("").join(" ")}`}>{t.code}</p>
      <p className={s.meta}>{fmtMD(t.expiresAt)}까지 · 메인안주 1개 주문 시</p>
    </>
  );
  const stub = t.image ? (
    <Image src={t.image.src} alt="" width={120} height={120} sizes="120px" unoptimized={!t.image.local} className={cut ? s.stubCut : s.stubPhoto} />
  ) : (
    <span className={`disp ${s.stubText}`} aria-hidden="true">
      {STUB_LABEL.split("").map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </span>
  );
  const sizeCls = size === "lg" ? s.lg : s.md;
  if (bg) {
    return (
      <div className={`${s.wrap} ${dim ? s.dim : ""} ${className}`} style={{ "--r": `${rotate}deg` } as CSSProperties} data-store={t.storeId}>
        <div className={`${s.kit} ${sizeCls}`}>
          <Image src={bg.src} alt="" width={bg.w} height={bg.h} sizes="(min-width: 480px) 448px, calc(100vw - 32px)" className={s.kitImg} draggable={false} priority={size === "lg"} />
          <div className={`${s.main} ${s.kitMain}`}>{main}</div>
          <div className={`${s.stub} ${s.kitStub}`}>{stub}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${s.wrap} ${dim ? s.dim : ""} ${className}`} style={{ "--r": `${rotate}deg` } as CSSProperties} data-store={t.storeId}>
      <div className={`${s.ticket} ${sizeCls}`}>
        <div className={s.main}>{main}</div>
        <div className={s.stub}>{stub}</div>
      </div>
    </div>
  );
}
