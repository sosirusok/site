import type { CSSProperties, ReactNode } from "react";

/** 섹션마다 다른 형광색 — 머리 숫자의 테두리와 영문 라벨, 색면형 머리의 바탕에 쓴다 */
export type Tone = "mag" | "cyan" | "lime" | "yellow";
const TONE: Record<Tone, string> = { mag: "var(--mag)", cyan: "var(--cyan)", lime: "var(--lime)", yellow: "var(--yellow)" };

/** 머리 모양 — 번호형(숫자+영문+제목) / 띠형(제목+오른쪽 라벨+굵은 선) / 색면형(단색 판에 검은 제목만) */
export type Head = "no" | "band" | "slab";

type Props = {
  id?: string;
  /** 영문 라벨("STORES") — Anton 12px 대문자, 앞에 형광 막대 */
  eyebrow?: string;
  /** 한글 간판 제목 — Black Han Sans 29~38px */
  title?: ReactNode;
  lead?: ReactNode;
  alt?: boolean;
  /** 왼쪽의 속 빈 거대 숫자("01"). 없으면 머리가 한 칸으로 붙는다 — 섹션마다 머리 모양이 달라진다 */
  no?: string;
  /** 머리 모양을 직접 고른다. 주지 않으면 no 가 있으면 번호형, 없으면 띠형 */
  head?: Head;
  tone?: Tone;
  /** 좌우 여백 0 — 가로 스크롤 스트립·전면 사진 패널을 쓰는 섹션 */
  flush?: boolean;
  /** 위·아래 여백을 섹션마다 다르게(리듬) */
  pt?: number;
  pb?: number;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * 섹션 — 머리는 [속 빈 거대 숫자] + [Anton 영문 라벨] + [Black Han Sans 한글 제목] + [라벤더 한 줄].
 * 숫자를 주지 않으면 한 칸 머리, flush 면 좌우 여백 없이 내용이 화면 끝까지 간다. 여백은 섹션마다 다르게 준다.
 */
export function Section({ id, eyebrow, title, lead, alt = false, no, head, tone = "mag", flush = false, pt, pb, action, className = "", children }: Props) {
  const hid = id ? `${id}-title` : undefined;
  const style: CSSProperties = { ["--tone" as string]: TONE[tone] };
  if (pt != null) style["--pt" as keyof CSSProperties] = `${pt}px` as never;
  if (pb != null) style["--pb" as keyof CSSProperties] = `${pb}px` as never;
  return (
    <section id={id} className={`section ${alt ? "section-alt" : ""} ${flush ? "section-flush" : ""} ${className}`} style={style} aria-labelledby={title ? hid : undefined}>
      {(title || eyebrow) && ((head ?? (no ? "no" : "band")) === "slab" ? (
        /* ③ 색면형 머리 — 화면 폭 단색 판에 검은 제목만. 보라가 끊기는 자리 */
        <div className="section-head section-head-slab">
          {title && <h2 id={hid} className="d2">{title}</h2>}
          {lead && <p className="lead">{lead}</p>}
          {action && <div className="section-head-action">{action}</div>}
        </div>
      ) : (head ?? (no ? "no" : "band")) === "no" && no ? (
        /* ① 번호형 머리 — 왼쪽에 속 빈 거대 숫자, 오른쪽에 라벨·제목·한 줄 */
        <div className="section-head">
          <span className="section-head-no" aria-hidden="true">{no}</span>
          <div className="section-head-text">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2 id={hid} className="d2">{title}</h2>}
            {lead && <p className="lead">{lead}</p>}
          </div>
          {action && <div className="section-head-action">{action}</div>}
        </div>
      ) : (
        /* ② 띠형 머리 — 제목이 먼저 오고 영문 라벨이 같은 줄 오른쪽에, 그 아래 형광 굵은 선. 머리 모양이 섹션마다 같지 않다 */
        <div className="section-head section-head-band">
          <div className="section-head-bandrow">
            {title && <h2 id={hid} className="d2">{title}</h2>}
            {eyebrow && <span className="lbl section-head-tag">{eyebrow}</span>}
          </div>
          {lead && <p className="lead section-head-lead">{lead}</p>}
          {action && <div className="section-head-action">{action}</div>}
        </div>
      ))}
      {children}
    </section>
  );
}
