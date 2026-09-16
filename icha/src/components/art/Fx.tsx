"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { art } from "@/lib/art";
import styles from "./Fx.module.css";

/**
 * 사장님 자산 32번 "선택과 완료 동작에 들어가는 짧은 효과" — 낱장 그림을 차례로 바꿔 짧은 동작을 만든다.
 * select: 선택 틀에 초록 체크가 차오름(01~08) / ticket: 티켓이 자리잡음(09~16) / check: 동그라미 안에 체크가 그려짐(18~24) / spin: 확인 중 회전(25~32).
 * 움직임 줄이기 설정이면 마지막 장만 보여 준다.
 */
const SEQ = {
  select: range(1, 8),
  ticket: range(9, 16),
  check: range(18, 24),
  spin: range(25, 32),
} as const;

function range(a: number, b: number): string[] {
  const out: string[] = [];
  for (let i = a; i <= b; i++) out.push(`fx-${String(i).padStart(2, "0")}`);
  return out;
}

export function Fx({ seq, width = 96, fps = 12, loop = false, className = "", alt = "" }: { seq: keyof typeof SEQ; width?: number; fps?: number; loop?: boolean; className?: string; alt?: string }) {
  const frames = SEQ[seq];
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setI(frames.length - 1); return; }
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      if (n >= frames.length) {
        if (loop) n = 0;
        else { window.clearInterval(id); n = frames.length - 1; }
      }
      setI(n);
    }, 1000 / fps);
    return () => window.clearInterval(id);
  }, [frames, fps, loop]);
  const a = art(frames[Math.min(i, frames.length - 1)] as string);
  const first = art(frames[0] as string);
  return (
    <span className={`${styles.box} ${className}`} style={{ width, aspectRatio: `${first.width} / ${first.height}` }} aria-hidden={alt ? undefined : true} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <Image src={a.src} alt="" width={a.width} height={a.height} className={styles.img} unoptimized draggable={false} />
    </span>
  );
}
