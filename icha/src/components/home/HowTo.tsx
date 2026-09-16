import type { CSSProperties } from "react";
import { KitPiece, StickerButton } from "@/components/site/Kit";
import { Piece } from "@/components/site/Poster";
import { StepsStrip } from "@/components/site/StepsStrip";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

/** 영수증 릴레이 EVENT — 포스터 리본, 순서 네 칸, 손글씨 메모 한 장(번호 말하면 쿠폰 — 키트 note-phone 이 오면 그 그림), 조건 알약 조각. */
export function HowTo({ rules, loggedIn }: { rules: Rules; loggedIn: boolean }) {
  return (
    <section className={s.how} aria-labelledby="how-title">
      <h2 id="how-title" className="sr-only">영수증 릴레이 EVENT — 이렇게 받아요</h2>
      <Piece name="ribbon-event" rotate={-1.5} className={`tape ${s.ribbon}`} />
      <StepsStrip className={s.steps} />
      <div className={s.noteRow}>
        <KitPiece
          name="note-phone"
          rotate={-2}
          sizes="260px"
          className={s.note}
          fallback={
            <div className={`scrap ${s.note}`} style={{ "--r": "-2deg" } as CSSProperties}>
              <p className={`scrap-in hand ${s.noteIn}`}>계산할 때 휴대폰 번호를 말하면 쿠폰이 들어와요</p>
            </div>
          }
        />
        <StickerButton kind="wallet" href={loggedIn ? "/wallet" : "/login"} tilt={1} className={s.walletBtn}>내 쿠폰함 열기</StickerButton>
      </div>
      <div className={s.pillRow}>
        <Piece name="pill-condition" rotate={1} sizes="340px" className={s.pill} />
        <p className={`hand hand-w ${s.rule}`}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
