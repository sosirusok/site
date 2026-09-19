import type { ReactNode } from "react";
import k from "./kit.module.css";

/**
 * " · " 로 잇는 정보 줄(규칙·유효기간·조건) — 항목마다 inline-block 이라 줄바꿈은 항목 사이(구분점 뒤 공백)에서만 일어난다.
 * 외자 하나가 다음 줄로 떨어지는 일이 없고, nowrap 이 아니라 항목이 칸보다 길면 그 안에서 접힌다. 문자열 항목은 " · " 로 다시 나눈다.
 */
export function DotLine({ items, className = "" }: { items: ReactNode[]; className?: string }) {
  const list = items.flatMap((it) => (typeof it === "string" ? it.split(" · ").filter(Boolean) : [it]));
  return (
    <span className={className}>
      {list.map((it, i) => (
        <span key={i}><span className={k.dotItem}>{it}{i < list.length - 1 && " ·"}</span>{i < list.length - 1 && " "}</span>
      ))}
    </span>
  );
}
