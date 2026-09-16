"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { Fx } from "@/components/art/Fx";
import { formatWon } from "@/lib/config";
import { ReceiptResult } from "./ReceiptResult";
import type { ApiFail, ReceiptApiOk, StoreLite, UploadRules } from "./types";
import styles from "./ReceiptUploader.module.css";

type Phase =
  | { kind: "idle" }
  | { kind: "preview"; file: File; url: string }
  | { kind: "uploading"; file: File; url: string }
  | { kind: "done"; file: File; url: string; result: ReceiptApiOk }
  | { kind: "error"; file: File; url: string; message: string; status: number };

export type RetryMode = "camera" | "album" | null;

/** 서버가 하는 일 순서. 응답이 올 때까지 이 세 줄을 돌려 가며 보여 준다. */
const STEPS = ["영수증 읽는 중", "매장 대조 중", "중복 확인 중"] as const;
const MAX_BYTES = 15 * 1024 * 1024;
/** 결과가 너무 빨리 튀어나오지 않도록 최소 표시 시간 */
const MIN_WAIT_MS = 1400;
/** 브라우저에서 미리 줄여 보내는 긴 변 크기(서버 규격과 같음) */
const MAX_EDGE = 1600;

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

function post(fd: FormData): Promise<{ status: number; data: ReceiptApiOk | ApiFail | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/receipts");
    xhr.responseType = "json";
    xhr.onload = () => resolve({ status: xhr.status, data: (xhr.response as ReceiptApiOk | ApiFail | null) ?? null });
    xhr.onerror = () => reject(new Error("network"));
    xhr.onabort = () => reject(new Error("abort"));
    xhr.send(fd);
  });
}

export function ReceiptUploader({ rules, stores, totalSpend }: { rules: UploadRules; stores: StoreLite[]; totalSpend: number }) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [pickError, setPickError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [step, setStep] = useState(0);
  /** 이 화면에서 승인된 금액을 더해 가며 '누적 인정 금액'을 보여 준다 */
  const [spent, setSpent] = useState(totalSpend);
  const urlRef = useRef<string | null>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  // 이전 미리보기 URL 정리
  useEffect(() => {
    const url = "url" in phase ? phase.url : null;
    if (urlRef.current && urlRef.current !== url) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
  }, [phase]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  // 올리는 동안 진행 줄을 순환시킨다
  useEffect(() => {
    if (phase.kind !== "uploading") return;
    setStep(0);
    const t = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1600);
    return () => window.clearInterval(t);
  }, [phase.kind]);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const looksImage = f.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name);
    if (!looksImage) { setPickError("사진 파일만 올릴 수 있어요."); return; }
    if (f.size > MAX_BYTES) { setPickError("사진 용량이 너무 커요. 15MB 이하 사진으로 올려 주세요."); return; }
    setPickError(null);
    setPreviewBroken(false);
    setPhase({ kind: "preview", file: f, url: URL.createObjectURL(f) });
  }

  async function submit() {
    if (phase.kind !== "preview" && phase.kind !== "error") return;
    const { file, url } = phase;
    const startedAt = Date.now();
    setPhase({ kind: "uploading", file, url });

    const sendFile = await toJpeg(file);
    const fd = new FormData();
    fd.append("file", sendFile, sendFile.name || "receipt.jpg");

    let res: { status: number; data: ReceiptApiOk | ApiFail | null } | null = null;
    try {
      res = await post(fd);
    } catch {
      res = null;
    }
    const remain = MIN_WAIT_MS - (Date.now() - startedAt);
    if (remain > 0) await new Promise((r) => setTimeout(r, remain));

    if (!res) {
      setPhase({ kind: "error", file, url, message: "연결이 끊겨서 사진을 보내지 못했어요. 통신 상태를 확인한 뒤 다시 보내 주세요.", status: 0 });
      return;
    }
    const { status, data } = res;
    if (status < 200 || status >= 300 || !data || !data.ok) {
      const serverMsg = data && !data.ok ? data.error : null;
      const message =
        status === 401 ? "로그인이 풀렸어요. 다시 로그인하면 이어서 올릴 수 있어요."
        : status === 429 ? "지금 요청이 너무 잦아요. 잠시 뒤에 다시 올려 주세요."
        : status === 413 || /용량/.test(serverMsg ?? "") ? "사진 용량이 너무 커요. 다른 사진으로 다시 올려 주세요."
        : serverMsg || "접수 중에 문제가 생겼어요. 잠시 뒤에 다시 올려 주세요.";
      setPhase({ kind: "error", file, url, message, status });
      return;
    }
    if (data.receipt.status === "approved" && data.receipt.amount) setSpent((s) => s + (data.receipt.amount ?? 0));
    setPhase({ kind: "done", file, url, result: data });
  }

  function reset() {
    setStep(0);
    setPhase({ kind: "idle" });
  }

  /** 결과 화면에서 '다시 찍기' — 처음으로 돌아간 뒤 바로 카메라/앨범을 연다 */
  function retry(mode: RetryMode) {
    reset();
    if (mode) window.requestAnimationFrame(() => (mode === "camera" ? camRef : albumRef).current?.click());
  }

  const minAmountText = rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상 결제한 영수증만 되고, ` : "";

  return (
    <div className={styles.root} data-phase={phase.kind}>
      {/* 파일 입력은 어느 단계에서든 열 수 있게 항상 둔다 */}
      <input ref={camRef} id={`${id}-camera`} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onPick} tabIndex={-1} aria-hidden="true" />
      <input ref={albumRef} id={`${id}-album`} className="sr-only" type="file" accept="image/*" onChange={onPick} />

      {phase.kind === "idle" && (
        <>
          <label className={`panel ${styles.drop}`} htmlFor={`${id}-album`}>
            <span className={styles.dropArt} aria-hidden="true">
              <Art name="upload-area-1" sizes="(min-width: 760px) 200px, 42vw" priority />
            </span>
            <span className={styles.dropText}>
              <b>여기를 눌러</b> 영수증 사진을 올려 주세요.
              <span className={styles.dropSub}>계산하고 받은 종이 영수증 한 장이면 돼요.</span>
            </span>
          </label>
          <div className={styles.buttons}>
            <ArtButton kind="shoot" width={380} onClick={() => camRef.current?.click()} />
            <ArtButton kind="pick-photo" width={380} onClick={() => albumRef.current?.click()} />
          </div>
          {pickError && <p className="error" role="alert">{pickError}</p>}

          <section className={styles.guide} aria-labelledby={`${id}-guide`}>
            <h2 id={`${id}-guide`} className="h3">이렇게 찍어 주세요</h2>
            <ul className={styles.guides}>
              <li>
                <Art name="shoot-guide-1" alt="영수증 전체가 틀 안에 들어온 좋은 예" sizes="30vw" />
                <span className={styles.guideOk}>전체가 보이게</span>
              </li>
              <li>
                <Art name="shoot-guide-2" alt="위가 잘린 예" sizes="30vw" />
                <span className={styles.guideNo}>잘리지 않게</span>
              </li>
              <li>
                <Art name="shoot-guide-3" alt="글자가 흐린 예" sizes="30vw" />
                <span className={styles.guideNo}>흔들리지 않게</span>
              </li>
            </ul>
            <p className={styles.rules}>
              결제하고 {rules.receiptValidHours}시간 안에 올려 주세요. {minAmountText}하루 {rules.dailyLimitPerMember}장까지 받아요. 영수증을 받은 집에서는 못 받아요.
            </p>
          </section>
        </>
      )}

      {phase.kind === "preview" && (
        <div className={styles.preview}>
          <figure className={`panel ${styles.frame}`}>
            {previewBroken ? (
              <figcaption className={styles.frameFallback}>이 형식은 미리보기가 안 돼요. 올리는 건 그대로 할 수 있어요.</figcaption>
            ) : (
              /* 방금 고른 로컬 파일 미리보기 — 정적 자산이 아니므로 next/image 를 쓰지 않는다 */
              // eslint-disable-next-line @next/next/no-img-element
              <img src={phase.url} alt="올릴 영수증 사진" onError={() => setPreviewBroken(true)} />
            )}
          </figure>
          <p className={styles.previewText}>상호, 결제 시각, 금액, 승인번호가 보이면 돼요.</p>
          <div className={styles.actions}>
            <button type="button" className="btn btn-lg btn-block" onClick={submit}>이 사진으로 올릴게요</button>
            <button type="button" className="btn btn-outline btn-block" onClick={reset}>다른 사진 고르기</button>
          </div>
        </div>
      )}

      {phase.kind === "uploading" && (
        <div className={styles.progress} role="status" aria-live="polite">
          <div className={styles.progressArt} aria-hidden="true">
            <Art name="status-checking" sizes="(min-width: 760px) 200px, 45vw" />
          </div>
          <div className={styles.progressHead}>
            <Fx seq="spin" loop width={56} />
            <p className="h3">영수증을 확인하고 있어요</p>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((label, i) => (
              <li key={label} className={styles.step} data-state={i === step ? "now" : i < step ? "done" : "todo"}>
                <span className={styles.stepDot} aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ol>
          <p className={styles.progressNote}>보통 10초 안에 끝나요. 화면을 닫지 말고 잠깐만 기다려 주세요.</p>
        </div>
      )}

      {phase.kind === "done" && <ReceiptResult result={phase.result} stores={stores} rules={rules} totalSpend={spent} onRetry={retry} />}

      {phase.kind === "error" && (
        <div className={styles.failed} role="alert">
          <div className={styles.failedArt} aria-hidden="true">
            <Art name="retry" sizes="(min-width: 760px) 160px, 36vw" />
          </div>
          <p className="h2">아직 못 받았어요</p>
          <p className={styles.failedText}>{phase.message}</p>
          <div className={styles.actions}>
            {phase.status === 401 ? (
              <Link href="/login?next=/verify" className="btn btn-lg btn-block">다시 로그인</Link>
            ) : (
              <button type="button" className="btn btn-lg btn-block" onClick={submit}>같은 사진으로 다시 보낼게요</button>
            )}
            <button type="button" className="btn btn-outline btn-block" onClick={reset}>다른 사진 고르기</button>
          </div>
        </div>
      )}
    </div>
  );
}
