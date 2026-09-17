import { BRAND } from "@/lib/config";

const WORDS = ["1차 도쿄스탠드", "2차 조선칼국수", "3차 와르르맨숀", "세 매장 50m 이내", BRAND.eventTag] as const;

/** 검은 띠 — 포스터 문구가 노란 Do Hyeon 으로 흘러간다. 움직임 줄이기면 멈춘 채 한 번만 보인다. 장식이라 스크린 리더에는 감춘다. */
export function Marquee() {
  const run = (
    <span className="marq-run">
      {WORDS.map((w) => (
        <span key={w}>{w}<span aria-hidden="true"> · </span></span>
      ))}
    </span>
  );
  return (
    <div className="marq" aria-hidden="true">
      <div className="marq-track">
        {run}
        {run}
      </div>
    </div>
  );
}
