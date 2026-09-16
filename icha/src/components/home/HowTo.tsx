import type { CSSProperties } from "react";
import { KitPiece, StickerButton } from "@/components/site/Kit";
import { Piece } from "@/components/site/Poster";
import { StepsStrip } from "@/components/site/StepsStrip";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

/** 영수증 릴레이 EVENT — 포스터 리본, 순서 네 칸, 안내 종이 한 장(번호 → 쿠폰 발급 — 키트 note-phone 이 오면 그 그림), 조건 알약 조각 + 규칙 한 줄(어두운 띠). */
export function HowTo({ rules, loggedIn }: { rules: Rules; loggedIn: boolean }) {
  return (
    <section className={s.how} aria-labelledby="how-title">
      <h2 id="how-title" className="sr-only">영수증 릴레이 EVENT 이용 방법</h2>
      <Piece name="ribbon-event" rotate={-1.5} className={`tape ${s.ribbon}`} />
      <StepsStrip className={s.steps} />
      <div className={s.noteRow}>
        <KitPiece
          name="note-phone"
          rotate={-2}
          sizes="260px"
          className={s.note}
          fallback={<p className={`paper ${s.note} ${s.noteIn}`} style={{ "--r": "-1deg" } as CSSProperties}>계산 시 휴대폰 번호를 말씀하시면 쿠폰이 발급됩니다</p>}
        />
        <StickerButton kind="wallet" href={loggedIn ? "/wallet" : "/login"} tilt={1} className={s.walletBtn}>쿠폰함</StickerButton>
      </div>
      <div className={s.pillRow}>
        <Piece name="pill-condition" rotate={1} sizes="340px" className={s.pill} />
        <p className={`info ${s.rule}`}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
