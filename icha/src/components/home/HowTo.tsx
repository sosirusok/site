import type { CSSProperties } from "react";
import { KitPiece, StickerButton } from "@/components/site/Kit";
import { Piece } from "@/components/site/Poster";
import { StepsStrip } from "@/components/site/StepsStrip";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

/**
 * 영수증 릴레이 EVENT — 키트 리본(한 단 가득 358x58), 순서 네 칸(2×2 + 화살표), 휴대폰 번호 메모(note-phone 300px) + [쿠폰함 열기](52px),
 * 조건 알약(pill-condition 300px 가운데) + 규칙 한 줄(어두운 띠).
 */
export function HowTo({ rules, loggedIn }: { rules: Rules; loggedIn: boolean }) {
  return (
    <section className={s.how} aria-labelledby="how-title">
      <h2 id="how-title" className="sr-only">영수증 릴레이 EVENT 이용 방법</h2>
      <Piece name="ribbon-event" rotate={-1} className={s.ribbon} sizes="(min-width: 480px) 448px, 100vw" />
      <StepsStrip className={s.steps} />
      <div className={s.noteRow}>
        <KitPiece
          name="note-phone"
          rotate={-2}
          sizes="300px"
          className={s.note}
          fallback={<p className={`paper ${s.note} ${s.noteIn}`} style={{ "--r": "-1deg" } as CSSProperties}>계산 시 휴대폰 번호를 말씀하시면 쿠폰이 발급됩니다</p>}
        />
        <StickerButton kind="wallet" href={loggedIn ? "/wallet" : "/login"} tilt={1} className={s.walletBtn}>쿠폰함 열기</StickerButton>
      </div>
      <div className={s.pillRow}>
        <Piece name="pill-condition" rotate={0} sizes="300px" className={s.pill} />
        <p className={s.rule}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
