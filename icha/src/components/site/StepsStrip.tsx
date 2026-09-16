import { Piece, type PieceName } from "./Poster";
import s from "./StepsStrip.module.css";

const STEPS: { name: PieceName; r: number }[] = [
  { name: "step-1", r: -2 },
  { name: "step-2", r: 1.5 },
  { name: "step-3", r: -1 },
  { name: "step-4", r: 2 },
];

/** 포스터의 순서 네 칸 — 한 줄로는 글자가 작아서 두 줄(2+2)로 나눠 붙이고 사이에 빨간 화살표. */
export function StepsStrip({ className = "" }: { className?: string }) {
  return (
    <ol className={`${s.steps} ${className}`} aria-label="영수증 릴레이 이용 방법">
      {STEPS.map((st) => (
        <li key={st.name} className={s.step}>
          <Piece name={st.name} rotate={st.r} sizes="220px" className={s.img} />
        </li>
      ))}
    </ol>
  );
}
