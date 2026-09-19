import Image from "next/image";
import type { StoreId } from "@/lib/config";
import { fmtMD } from "./format";
import s from "./Ticket.module.css";

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
  /** 조건 줄을 바꿔 쓸 때(사용한 쿠폰: "9월 17일 08:58 사용"). 없으면 "10월 17일까지 · 메인안주 1개 주문 시" */
  meta?: string | null;
};
export type TicketSize = "md" | "lg";
export type TicketProps = {
  t: TicketData;
  size?: TicketSize;
  /** 쓴·지난 쿠폰은 흐리게 */
  dim?: boolean;
  /** 오른쪽 위 상태 표시("사용 완료" 등) */
  stamp?: string | null;
  className?: string;
};

/**
 * 쿠폰 한 장 — 그 집 형광색 테두리의 각진 티켓, [매장 배지 · 종류] / 품목 이름(간판체) / 코드(Anton 26px) / 조건 줄, 오른쪽에 품목 사진(있으면).
 * md 는 쿠폰함 목록(사진 64px), lg 는 쿠폰 화면(사진 88px, 글자 큼). 기울임·도장 없음.
 */
export function Ticket({ t, size = "md", dim = false, stamp = null, className = "" }: TicketProps) {
  const cut = t.image?.local && /\.png$/i.test(t.image.src);
  const px = size === "lg" ? 88 : 64;
  return (
    <div className={`${s.card} ${size === "lg" ? s.lg : ""} ${dim ? s.dim : ""} ${className}`} data-store={t.storeId}>
      <div className={s.body}>
        <p className={s.badges}>
          <span className="badge badge-store">{t.storeName}</span>
          {t.kindLabel && <span className="badge">{t.kindLabel}</span>}
        </p>
        <p className={s.name}>{t.menuName} <span className={s.free}>무료</span></p>
        <p className={s.code} aria-label={`쿠폰 코드 ${t.code.split("").join(" ")}`}>{t.code}</p>
        <p className={`small muted num ${s.meta}`}>{t.meta ?? `${fmtMD(t.expiresAt)}까지 · 메인안주 1개 주문 시`}</p>
      </div>
      {t.image ? (
        <Image src={t.image.src} alt="" width={px} height={px} sizes={`${px}px`} unoptimized={!t.image.local} className={cut ? s.thumbCut : s.thumb} style={{ width: px, height: px }} />
      ) : (
        <span className={s.thumbEmpty} style={{ width: px, height: px, fontSize: px * 0.34 }} aria-hidden="true">1:1</span>
      )}
      {stamp && <span className={s.stamp}>{stamp}</span>}
    </div>
  );
}
