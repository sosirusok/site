"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { CameraIcon } from "@/components/ui/icons";
import { fmtTime } from "./format";
import { ReceiptResult } from "./ReceiptResult";
import type { ApiFail, ReceiptApiOk, StoreLite, UploadRules } from "./types";
import styles from "./ReceiptUploader.module.css";

type Phase =
  | { kind: "idle" }
  | { kind: "preview"; file: File; url: string }
  | { kind: "printing"; file: File; url: string }
  | { kind: "done"; file: File; url: string; result: ReceiptApiOk }
  | { kind: "error"; file: File; url: string; message: string; status: number };

type Line = { id: number; text: string; note?: string };

const WAIT_STEPS = ["영수증 읽는 중", "매장 대조 중", "중복 확인 중"];
const MAX_BYTES = 15 * 1024 * 1024;
/** 세 줄이 다 인쇄될 시간은 확보한다(응답이 더 빨라도 줄이 튀지 않게). 응답이 늦으면 그만큼 계속 인쇄된다. */
const MIN_PRINT_MS = 3200;

function fileLabel(f: File): string {
  const mb = f.size / (1024 * 1024);
  return `${f.name.length > 28 ? `${f.name.slice(0, 26)}…` : f.name} · ${mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.max(1, Math.round(f.size / 1024))}KB`}`;
}

export function ReceiptUploader({ rules, stores }: { rules: UploadRules; stores: StoreLite[] }) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [pickError, setPickError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const urlRef = useRef<string | null>(null);

  // 이전 미리보기 URL 정리
  useEffect(() => {
    const url = "url" in phase ? phase.url : null;
    if (urlRef.current && urlRef.current !== url) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
  }, [phase]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  // 감열 프린터: 응답을 기다리는 동안 실제 단계 이름을 한 줄씩 인쇄하고, 길어지면 회차를 붙여 반복한다
  useEffect(() => {
    if (phase.kind !== "printing") return;
    let i = 0;
    setLines([{ id: 0, text: "접수", note: fmtTime(new Date()) }]);
    const t = setInterval(() => {
      i += 1;
      const cycle = Math.floor((i - 1) / WAIT_STEPS.length);
      const step = WAIT_STEPS[(i - 1) % WAIT_STEPS.length] ?? "";
      setLines((ls) => [...ls, { id: i, text: step, note: cycle > 0 ? `${cycle + 1}회` : undefined }].slice(-9));
    }, 1000);
    return () => clearInterval(t);
  }, [phase.kind]);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const looksImage = f.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name);
    if (!looksImage) { setPickError("사진 파일(JPG, PNG, HEIC)만 올릴 수 있어요."); return; }
    if (f.size > MAX_BYTES) { setPickError("사진이 너무 커요. 15MB 이하로 올려 주세요."); return; }
    setPickError(null);
    setPreviewBroken(false);
    setPhase({ kind: "preview", file: f, url: URL.createObjectURL(f) });
  }

  async function submit() {
    if (phase.kind !== "preview" && phase.kind !== "error") return;
    const { file, url } = phase;
    const startedAt = Date.now();
    setPhase({ kind: "printing", file, url });
    const fd = new FormData();
    fd.append("file", file, file.name || "receipt.jpg");
    let res: Response | null = null;
    let data: ReceiptApiOk | ApiFail | null = null;
    let networkError = false;
    try {
      res = await fetch("/api/receipts", { method: "POST", body: fd });
      data = (await res.json().catch(() => null)) as ReceiptApiOk | ApiFail | null;
    } catch {
      networkError = true;
    }
    const remain = MIN_PRINT_MS - (Date.now() - startedAt);
    if (remain > 0) await new Promise((r) => setTimeout(r, remain));
    if (networkError || !res) {
      setPhase({ kind: "error", file, url, message: "연결이 끊겨 사진을 보내지 못했어요. 신호를 확인하고 다시 시도해 주세요.", status: 0 });
      return;
    }
    if (!res.ok || !data || !data.ok) {
      const status = res.status;
      const message =
        status === 401 ? "로그인이 풀렸어요. 다시 로그인하면 이어서 할 수 있어요."
        : status === 429 ? (data && !data.ok && data.error) || "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요."
        : status === 413 ? "사진이 너무 커요. 15MB 이하로 올려 주세요."
        : (data && !data.ok && data.error) || "접수 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
      setPhase({ kind: "error", file, url, message, status });
      return;
    }
    setLines([]);
    setPhase({ kind: "done", file, url, result: data });
  }

  function reset() {
    setLines([]);
    setPhase({ kind: "idle" });
  }

  const printing = phase.kind === "printing";
  const showPrinter = phase.kind === "printing" || phase.kind === "done" || phase.kind === "error";

  return (
    <div className={styles.root} data-phase={phase.kind}>
      {phase.kind === "idle" && (
        <div className={styles.pickers}>
          <label className={`btn btn-lg btn-block ${styles.pickBtn}`} htmlFor={`${id}-camera`}>
            <CameraIcon size={22} />
            <span>카메라로 찍기</span>
            <input id={`${id}-camera`} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onPick} />
          </label>
          <label className={`btn btn-outline btn-lg btn-block ${styles.pickBtn}`} htmlFor={`${id}-album`}>
            <span>앨범에서 고르기</span>
            <input id={`${id}-album`} className="sr-only" type="file" accept="image/*" onChange={onPick} />
          </label>
          {pickError && <p className="error" role="alert">{pickError}</p>}
          <ul className={styles.hints}>
            <li>영수증을 평평하게 펴고 전체가 나오게 찍어요.</li>
            <li>상호, 결제 일시, 금액, 승인번호가 보이면 바로 승인돼요.</li>
            <li>화면 캡처나 재출력본은 받지 않아요.</li>
          </ul>
        </div>
      )}

      {phase.kind === "preview" && (
        <div className={styles.preview}>
          <figure className={styles.frame}>
            {previewBroken ? (
              <figcaption className={styles.frameFallback}>
                <span>이 형식(HEIC 등)은 미리보기가 안 돼요.<br />인증은 그대로 진행할 수 있어요.</span>
              </figcaption>
            ) : (
              /* 방금 고른 로컬 파일 미리보기 — 정적 자산이 아니므로 next/image 를 쓰지 않는다 */
              // eslint-disable-next-line @next/next/no-img-element
              <img src={phase.url} alt="올릴 영수증 사진 미리보기" onError={() => setPreviewBroken(true)} />
            )}
          </figure>
          <p className={`mono ${styles.fileLabel}`}>{fileLabel(phase.file)}</p>
          <div className={styles.previewActions}>
            <button type="button" className="btn btn-lg btn-block" onClick={submit}>이 사진으로 인증하기</button>
            <button type="button" className="btn btn-outline btn-block" onClick={reset}>다른 사진 고르기</button>
          </div>
        </div>
      )}

      {showPrinter && (
        <div className={styles.stage}>
          <div className={styles.thumbRow}>
            <span className={styles.thumb} aria-hidden="true">
              {!previewBroken && "url" in phase ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={phase.url} alt="" onError={() => setPreviewBroken(true)} />
              ) : (
                <span className={`mono ${styles.thumbMark}`}>IMG</span>
              )}
            </span>
            <span className={`mono ${styles.thumbLabel}`}>{"file" in phase ? fileLabel(phase.file) : ""}</span>
          </div>

          <div className={styles.printer} data-printing={printing ? "1" : undefined}>
            <div className={styles.head}>
              <span className={styles.led} aria-hidden="true" />
              <span className={`mono ${styles.headLabel}`}>이차 영수증 판독기</span>
              <span className={`mono ${styles.headState}`}>{printing ? "인쇄 중" : phase.kind === "done" ? "완료" : "중단"}</span>
              <span className={styles.carriage} aria-hidden="true" />
              <span className={styles.slit} aria-hidden="true" />
            </div>
            <div className={styles.feed}>
              <div className={styles.tape} key={phase.kind === "printing" ? "wait" : "final"}>
                <p className={styles.tapeTitle}>영수증 접수증</p>
                {phase.kind === "printing" && (
                  <ul className={styles.lines} aria-label="처리 단계">
                    {lines.map((l) => (
                      <li key={l.id} className={styles.line}>
                        <span>{l.text}</span>
                        <span className={styles.leader} aria-hidden="true" />
                        <span className={styles.note}>{l.note ?? "…"}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {phase.kind === "done" && <ReceiptResult result={phase.result} stores={stores} rules={rules} onRetry={reset} />}
                {phase.kind === "error" && (
                  <div className={styles.result}>
                    <ul className={styles.steps}>
                      <li className={styles.line} style={{ "--i": 0 } as React.CSSProperties}>
                        <span>접수</span><span className={styles.leader} aria-hidden="true" /><span className={`${styles.state} ${styles.tone_bad}`}>실패</span>
                      </li>
                    </ul>
                    <hr className={styles.sep} style={{ "--i": 1 } as React.CSSProperties} />
                    <p className={`${styles.verdictTitle} ${styles.errorTitle}`} role="alert">{phase.message}</p>
                    <div className={styles.actions}>
                      {phase.status === 401 ? (
                        <Link href="/login?next=/verify" className="btn btn-lg btn-block">다시 로그인하기</Link>
                      ) : (
                        <button type="button" className="btn btn-lg btn-block" onClick={submit}>같은 사진으로 다시 시도</button>
                      )}
                      <button type="button" className={`btn btn-block ${styles.inkOutline}`} onClick={reset}>다른 사진 고르기</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
