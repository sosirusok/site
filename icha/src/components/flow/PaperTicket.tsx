import Image from "next/image";
import type { CSSProperties } from "react";
import type { StoreId } from "@/lib/config";
import { fmtMD } from "./format";
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

/**
 * 크림 종이 쿠폰 한 장 — 오른쪽에 점선으로 뜯는 반쪽(사진 또는 이벤트 이름), 위아래 구멍, 코드는 Do Hyeon.
 * md 는 쿠폰함 목록, lg 는 쿠폰 화면.
 */
export function PaperTicket({ t, size = "md", rotate = 0, dim = false, className = "" }: { t: TicketData; size?: "md" | "lg"; rotate?: number; dim?: boolean; className?: string }) {
  const cut = t.image?.local && /\.png$/i.test(t.image.src);
  return (
    <div className={`${s.wrap} ${dim ? s.dim : ""} ${className}`} style={{ "--r": `${rotate}deg` } as CSSProperties} data-store={t.storeId}>
      <div className={`${s.ticket} ${size === "lg" ? s.lg : s.md}`}>
        <div className={s.main}>
          <p className={s.store}><span className="plate plate-store plate-sm">{t.storeName}</span>{t.kindLabel && <span className="tag">{t.kindLabel}</span>}</p>
          <p className={`disp ${s.name}`}>{t.menuName}</p>
          <p className={`mono ${s.code}`} aria-label={`쿠폰 코드 ${t.code.split("").join(" ")}`}>{t.code}</p>
          <p className={s.meta}>{fmtMD(t.expiresAt)}까지 · 메인안주 1개 주문 시</p>
        </div>
        <div className={s.stub}>
          {t.image ? (
            <Image src={t.image.src} alt="" width={120} height={120} sizes="120px" unoptimized={!t.image.local} className={cut ? s.stubCut : s.stubPhoto} />
          ) : (
            <span className={`disp ${s.stubText}`}>알콜부시기</span>
          )}
        </div>
      </div>
    </div>
  );
}
