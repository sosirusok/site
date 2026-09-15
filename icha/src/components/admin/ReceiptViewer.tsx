"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/receipts/receipts.module.css";

const STEPS = [0.5, 0.75, 1, 1.5, 2, 3];

/** 영수증 원본 보기 — 확대/축소/회전. 회전은 캔버스에 다시 그려서 스크롤 영역이 실제 크기를 따라가게 한다. */
export function ReceiptViewer({ src, originalHref }: { src: string; originalHref: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoomIdx, setZoomIdx] = useState(2);
  const [rot, setRot] = useState(0);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const draw = useCallback(() => {
    const img = imgRef.current;
    const c = canvasRef.current;
    if (!img || !c) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const swap = rot % 180 !== 0;
    c.width = swap ? h : w;
    c.height = swap ? w : h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2);
    ctx.restore();
  }, [rot]);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setStatus("ok");
      draw();
    };
    img.onerror = () => setStatus("error");
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
    // src 가 바뀔 때만 다시 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    draw();
  }, [draw]);

  const zoom = STEPS[zoomIdx] ?? 1;
  const width = imgRef.current ? (rot % 180 !== 0 ? imgRef.current.naturalHeight : imgRef.current.naturalWidth) : 0;

  return (
    <div className={ui.panel}>
      <div className={s.viewerBar}>
        <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="축소">
          −
        </button>
        <span className={s.zoom}>{Math.round(zoom * 100)}%</span>
        <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={() => setZoomIdx((i) => Math.min(STEPS.length - 1, i + 1))} disabled={zoomIdx === STEPS.length - 1} aria-label="확대">
          +
        </button>
        <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={() => setRot((r) => (r + 90) % 360)}>
          회전
        </button>
        <button type="button" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`} onClick={() => { setRot(0); setZoomIdx(2); }}>
          원래대로
        </button>
        <span style={{ flex: 1 }} />
        <a href={originalHref} target="_blank" rel="noreferrer" className={`${ui.button} ${ui.buttonGhost} ${ui.buttonSm}`}>
          원본 새 창
        </a>
      </div>
      <div className={s.viewerBox}>
        {status === "error" ? <div className={s.viewerEmpty}>이미지를 불러오지 못했습니다.</div> : null}
        {status === "loading" ? <div className={s.viewerEmpty}>사진 읽는 중…</div> : null}
        <canvas ref={canvasRef} style={{ width: status === "ok" && width ? `min(100%, ${Math.round(width * zoom)}px)` : "auto", maxWidth: zoom > 1 ? "none" : undefined, display: status === "ok" ? "block" : "none" }} aria-label="영수증 사진" role="img" />
      </div>
    </div>
  );
}
