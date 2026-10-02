"use client";
import { startTransition, type FormEvent } from "react";

/**
 * <form action={…}> 는 결과와 상관없이 보낸 뒤 입력칸을 비운다(React 19) — 오류가 나면 적은 것이 다 사라진다.
 * onSubmit 에서 직접 보내면 비우지 않는다. 성공했을 때 비우는 것은 각 폼이 key 를 바꾸거나 reset() 해서 한다.
 * prepare 가 null 을 돌려주면 보내지 않는다(예: 사진이 너무 커서 안내만 띄울 때).
 */
export function keepOnSubmit(action: (fd: FormData) => void, prepare?: (fd: FormData) => Promise<FormData | null>) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(e.currentTarget, submitter instanceof HTMLElement ? submitter : null);
    if (!prepare) {
      startTransition(() => action(fd));
      return;
    }
    void prepare(fd).then((ready) => {
      if (ready) startTransition(() => action(ready));
    });
  };
}

/** Vercel 은 요청 본문 4.5MB 까지 — 큰 사진은 폰에서 긴 변 1600px JPEG 로 줄여 보낸다(서버가 다시 900px 로 줄인다) */
export async function shrinkPhoto(fd: FormData, field = "image"): Promise<FormData | null> {
  const f = fd.get(field);
  if (!(f instanceof File) || f.size === 0 || f.size <= 3_000_000) return fd;
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * k));
    canvas.height = Math.max(1, Math.round(bmp.height * k));
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (blob && blob.size > 0 && blob.size < 3_800_000) {
      fd.set(field, blob, "photo.jpg");
      return fd;
    }
  } catch {
    /* 폰이 못 읽는 형식(예: 크롬의 HEIC) */
  }
  return null;
}
