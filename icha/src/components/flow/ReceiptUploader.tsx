"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ReceiptResult } from "./ReceiptResult";
import type { ApiFail, ReceiptApiOk, StoreLite, UploadRules } from "./types";
import styles from "./ReceiptUploader.module.css";

type Phase =
  | { kind: "idle" }
  | { kind: "preview"; file: File; url: string }
  | { kind: "uploading"; file: File; url: string }
  | { kind: "done"; file: File; url: string; result: ReceiptApiOk }
  | { kind: "error"; file: File; url: string; message: string; status: number };

/** 서버가 처리하는 순서 그대로. 접수(전송)만 실제 진행을 알 수 있고 나머지는 응답이 올 때까지 순서대로 넘어간다. */
const STEPS = ["접수", "판독", "매장 대조", "중복 확인"] as const;
const MAX_BYTES = 15 * 1024 * 1024;
/** 결과가 너무 빨리 튀어나오지 않도록 최소 표시 시간 */
const MIN_WAIT_MS = 1200;
/** 브라우저에서 미리 줄여 보내는 긴 변 크기(서버 규격과 같음) */
const MAX_EDGE = 1600;

function fileLabel(f: File): string {
  const mb = f.size / (1024 * 1024);
  const name = f.name.length > 28 ? `${f.name.slice(0, 26)}…` : f.name;
  return `${name} · ${mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.max(1, Math.round(f.size / 1024))}KB`}`;
}

/** 사진을 브라우저에서 JPEG 로 다시 인코딩한다(HEIC 변환·용량 축소). 실패하면 원본을 그대로 보낸다. */
async function toJpeg(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) throw new Error("no blob");
    return new File([blob], "receipt.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** 전송 완료 시점을 알 수 있도록 XMLHttpRequest 로 보낸다 */
function post(fd: FormData, onUploaded: () => void): Promise<{ status: number; data: ReceiptApiOk | ApiFail | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/receipts");
    xhr.responseType = "json";
    xhr.upload.onload = () => onUploaded();
    xhr.onload = () => resolve({ status: xhr.status, data: (xhr.response as ReceiptApiOk | ApiFail | null) ?? null });
    xhr.onerror = () => reject(new Error("network"));
    xhr.onabort = () => reject(new Error("abort"));
    xhr.send(fd);
  });
}

export function ReceiptUploader({ rules, stores }: { rules: UploadRules; stores: StoreLite[] }) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [pickError, setPickError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [step, setStep] = useState(0);
  const urlRef = useRef<string | null>(null);
  const timersRef = useRef<number[]>([]);

  // 이전 미리보기 URL 정리
  useEffect(() => {
    const url = "url" in phase ? phase.url : null;
    if (urlRef.current && urlRef.current !== url) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
  }, [phase]);
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    timersRef.current.forEach((t) => clearTimeout(t));
  }, []);

  function clearTimers() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const looksImage = f.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name);
    if (!looksImage) { setPickError("사진 파일만 올릴 수 있습니다."); return; }
    if (f.size > MAX_BYTES) { setPickError("사진 용량이 너무 큽니다. 15MB 이하 사진을 올려 주십시오."); return; }
    setPickError(null);
    setPreviewBroken(false);
    setPhase({ kind: "preview", file: f, url: URL.createObjectURL(f) });
  }

  async function submit() {
    if (phase.kind !== "preview" && phase.kind !== "error") return;
    const { file, url } = phase;
    const startedAt = Date.now();
    clearTimers();
    setStep(0);
    setPhase({ kind: "uploading", file, url });

    const sendFile = await toJpeg(file);
    const fd = new FormData();
    fd.append("file", sendFile, sendFile.name || "receipt.jpg");

    let res: { status: number; data: ReceiptApiOk | ApiFail | null } | null = null;
    let uploaded = false;
    const onUploaded = () => {
      if (uploaded) return;
      uploaded = true;
      // 전송이 끝나면 서버 처리 순서대로 넘어간다(응답이 오면 전부 완료 처리)
      setStep(1);
      timersRef.current.push(window.setTimeout(() => setStep(2), 2500));
      timersRef.current.push(window.setTimeout(() => setStep(3), 4500));
    };
    // 일부 환경에서는 전송 완료 이벤트가 오지 않는다 — 줄인 사진은 몇 초면 올라가므로 그 뒤에는 다음 단계로 본다
    timersRef.current.push(window.setTimeout(onUploaded, 3000));
    try {
      res = await post(fd, onUploaded);
    } catch {
      res = null;
    }
    clearTimers();
    const remain = MIN_WAIT_MS - (Date.now() - startedAt);
    if (remain > 0) await new Promise((r) => setTimeout(r, remain));

    if (!res) {
      setPhase({ kind: "error", file, url, message: "연결이 끊겨 사진을 보내지 못했습니다. 통신 상태를 확인한 뒤 다시 시도해 주십시오.", status: 0 });
      return;
    }
    const { status, data } = res;
    if (status < 200 || status >= 300 || !data || !data.ok) {
      const serverMsg = data && !data.ok ? data.error : null;
      const message =
        status === 401 ? "로그인이 만료되었습니다. 다시 로그인하면 이어서 진행할 수 있습니다."
        : status === 429 ? serverMsg || "요청이 너무 많습니다. 잠시 후 다시 시도해 주십시오."
        : status === 413 ? "사진 용량이 너무 큽니다. 다른 사진으로 다시 시도해 주십시오."
        : serverMsg || "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주십시오.";
      setPhase({ kind: "error", file, url, message, status });
      return;
    }
    setStep(STEPS.length);
    setPhase({ kind: "done", file, url, result: data });
  }

  function reset() {
    clearTimers();
    setStep(0);
    setPhase({ kind: "idle" });
  }

  return (
    <div className={styles.root} data-phase={phase.kind}>
      {phase.kind === "idle" && (
        <div className={styles.pickers}>
          <label className="btn btn-red btn-lg btn-block" htmlFor={`${id}-camera`}>
            카메라로 촬영
            <input id={`${id}-camera`} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onPick} />
          </label>
          <label className="btn btn-outline btn-lg btn-block" htmlFor={`${id}-album`}>
            앨범에서 선택
            <input id={`${id}-album`} className="sr-only" type="file" accept="image/*" onChange={onPick} />
          </label>
          {pickError && <p className="error" role="alert">{pickError}</p>}
          <div className={styles.hints}>
            <p className={styles.hintsTitle}>촬영 안내</p>
            <ul>
              <li>영수증을 평평하게 펴고 네 귀퉁이가 모두 나오도록 촬영합니다.</li>
              <li>상호, 결제 일시, 금액, 승인번호가 또렷해야 자동으로 판독됩니다.</li>
              <li>화면 캡처, 재출력본, 주문서(빌지)는 인정하지 않습니다.</li>
            </ul>
          </div>
        </div>
      )}

      {phase.kind === "preview" && (
        <div className={styles.preview}>
          <figure className={styles.frame}>
            {previewBroken ? (
              <figcaption className={styles.frameFallback}>이 형식은 미리보기를 지원하지 않습니다. 인증은 그대로 진행할 수 있습니다.</figcaption>
            ) : (
              /* 방금 고른 로컬 파일 미리보기 — 정적 자산이 아니므로 next/image 를 쓰지 않는다 */
              // eslint-disable-next-line @next/next/no-img-element
              <img src={phase.url} alt="올릴 영수증 사진 미리보기" onError={() => setPreviewBroken(true)} />
            )}
          </figure>
          <p className={`mono ${styles.fileLabel}`}>{fileLabel(phase.file)}</p>
          <div className={styles.actions}>
            <button type="button" className="btn btn-red btn-lg btn-block" onClick={submit}>이 사진으로 인증</button>
            <button type="button" className="btn btn-outline btn-block" onClick={reset}>다른 사진 선택</button>
          </div>
        </div>
      )}

      {phase.kind === "uploading" && (
        <div className={styles.progress} role="status" aria-live="polite">
          <p className={styles.progressTitle}>영수증을 확인하고 있습니다.</p>
          <ol className={styles.steps}>
            {STEPS.map((label, i) => {
              const state = i < step ? "done" : i === step ? "now" : "todo";
              return (
                <li key={label} className={styles.step} data-state={state}>
                  <span className={styles.stepName}>{i + 1}. {label}</span>
                  <span className={styles.stepState}>{state === "done" ? "완료" : state === "now" ? "진행 중" : "대기"}</span>
                </li>
              );
            })}
          </ol>
          <p className="small">보통 10초 안에 끝납니다. 화면을 닫지 마십시오.</p>
        </div>
      )}

      {phase.kind === "done" && <ReceiptResult result={phase.result} stores={stores} rules={rules} onRetry={reset} />}

      {phase.kind === "error" && (
        <div className={styles.failed}>
          <p className={styles.failedTitle}>접수되지 않았습니다.</p>
          <p className="error" role="alert">{phase.message}</p>
          <div className={styles.actions}>
            {phase.status === 401 ? (
              <Link href="/login?next=/verify" className="btn btn-red btn-lg btn-block">다시 로그인</Link>
            ) : (
              <button type="button" className="btn btn-red btn-lg btn-block" onClick={submit}>같은 사진으로 다시 시도</button>
            )}
            <button type="button" className="btn btn-outline btn-block" onClick={reset}>다른 사진 선택</button>
          </div>
        </div>
      )}
    </div>
  );
}
