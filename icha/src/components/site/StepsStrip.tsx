import { Piece, type PieceName } from "./Poster";
import s from "./StepsStrip.module.css";

const STEPS: { name: PieceName; r: number }[] = [
  { name: "step-1", r: -1.5 },
  { name: "step-2", r: 1 },
  { name: "step-3", r: -1 },
  { name: "step-4", r: 1.5 },
];

/**
 * 순서 네 칸(키트 step-1~4, 600x360) — 2×2. 두 칸 사이 44px 틈에 키트 화살표(arrow 600x300 → 44x22)가 1→2, 3→4(홀수 칸의 ::after),
 * 2→3 은 줄 사이(28px) 한가운데에서 왼쪽 아래로 꺾인 같은 화살표(40x20, 135도, 격자의 ::after) — 넷이 한 줄로 이어진다.
 * 칸 폭 = (단 − 44) / 2 → 390 화면 157px(94px 높이), 430 화면 175px.
 */
export function StepsStrip({ className = "" }: { className?: string }) {
  return (
    <ol className={`${s.steps} ${className}`} aria-label="영수증 릴레이 이용 방법">
      {STEPS.map((st) => (
        <li key={st.name} className={s.step}>
          <Piece name={st.name} rotate={st.r} sizes="180px" className={s.img} />
        </li>
      ))}
    </ol>
  );
}
