import type { CSSProperties } from "react";
import { KitPiece, StickerButton } from "@/components/site/Kit";
import { Piece } from "@/components/site/Poster";
import { StepsStrip } from "@/components/site/StepsStrip";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./home.module.css";

/**
 * 영수증 릴레이 EVENT — 키트 리본(한 단 가득 358x58, −1°)이 3차 장면의 아래를 20px 덮고 시작한다. 순서 네 칸(2×2 + 화살표),
 * 휴대폰 번호 메모(note-phone 300px, 2°)가 순서 격자의 오른쪽 아래 모서리를 덮고, [쿠폰함 열기](52px, −2°)가 메모의 왼쪽 아래 모서리를 덮는다.
 * 조건 알약(300px 가운데) 아래 규칙 한 줄(Do Hyeon 16px 흰 글자 외곽선). 빈 보케 없이 이어 붙는다.
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
          rotate={2}
          sizes="300px"
          className={s.note}
          fallback={<p className={`paper ${s.note} ${s.noteIn}`} style={{ "--r": "2deg" } as CSSProperties}>계산 시 휴대폰 번호를 말씀하시면 쿠폰이 발급됩니다</p>}
        />
        <StickerButton kind="wallet" href={loggedIn ? "/wallet" : "/login"} tilt={-1} className={s.walletBtn} style={{ "--r": "-2deg" } as CSSProperties}>쿠폰함 열기</StickerButton>
      </div>
      <div className={s.pillRow}>
        <Piece name="pill-condition" rotate={0} sizes="300px" className={s.pill} />
        <p className={`callout callout-w ${s.rule}`}>{ruleLine(rules)}</p>
      </div>
    </section>
  );
}
