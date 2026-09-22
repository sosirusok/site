"use client";
/**
 * 휴대폰 본인확인 — 브라우저 쪽.
 *
 * 통신사를 고르고 이름·생년월일·번호를 넣는 그 창은 우리가 그린 화면이 아니라 본인확인기관이 띄우는 창이다.
 * 여기서는 포트원 SDK 를 불러 그 창을 열기만 하고, 결과 판정은 전부 서버가 한다.
 * SDK 는 눌렀을 때 처음 받아 온다 — 쿠폰함 첫 화면이 이것 때문에 늦어지면 안 된다.
 */

export type StartInfo = {
  ok: true;
  mock: boolean;
  storeId?: string;
  channelKey?: string;
  identityVerificationId: string;
  redirectUrl: string;
  next: string;
  bypass?: Record<string, unknown>;
};

export type IdentityOutcome =
  | { kind: "done"; next: string; phone?: string }
  | { kind: "need-phone"; next: string }
  | { kind: "error"; message: string; underage?: boolean; code?: string }
  /** 모바일에서 인증창으로 화면이 통째로 넘어간 경우 — 돌아올 때 /login/done 이 이어받는다 */
  | { kind: "left" };

async function post(url: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, data };
}

/** 서버에 결과를 넘겨 확정받는다. 브라우저가 "성공"이라고 말하는 것만으로는 아무 일도 일어나지 않는다. */
export async function confirmIdentity(identityVerificationId: string): Promise<IdentityOutcome> {
  const { data } = await post("/api/identity/confirm", { identityVerificationId });
  if (data.ok !== true) {
    return { kind: "error", message: typeof data.error === "string" ? data.error : "본인확인에 실패했습니다.", underage: data.underage === true };
  }
  const next = typeof data.next === "string" ? data.next : "/wallet";
  if (data.needPhone === true) return { kind: "need-phone", next };
  const member = data.member as { phone?: string } | undefined;
  return { kind: "done", next, phone: member?.phone };
}

/**
 * 본인확인창을 연다.
 * @param next 끝난 뒤 돌아갈 사이트 안 경로
 * @param onUnavailable 아직 계약 전이라 본인확인을 쓸 수 없을 때 (화면이 번호 입력으로 되돌아간다)
 */
export async function runIdentityVerification(next: string, onUnavailable: () => void): Promise<IdentityOutcome> {
  const { status, data } = await post("/api/identity/start", { next });
  if (data.ok !== true) {
    if (status === 503) {
      onUnavailable();
      return { kind: "error", message: "본인확인이 아직 연결되지 않았습니다." };
    }
    return { kind: "error", message: typeof data.error === "string" ? data.error : "본인확인을 시작할 수 없습니다." };
  }
  const info = data as unknown as StartInfo;

  // 내 컴퓨터에서 흐름만 볼 때(PORTONE_IDENTITY_MOCK=1) — 운영에서는 여기로 오지 않는다
  if (info.mock) return confirmIdentity(info.identityVerificationId);

  const PortOne = await import("@portone/browser-sdk/v2");
  let res: Awaited<ReturnType<typeof PortOne.requestIdentityVerification>>;
  try {
    res = await PortOne.requestIdentityVerification({
      storeId: info.storeId!,
      channelKey: info.channelKey!,
      identityVerificationId: info.identityVerificationId,
      redirectUrl: info.redirectUrl,
      ...(info.bypass ? { bypass: info.bypass as never } : {}),
    });
  } catch (e) {
    // SDK 는 실패를 던지기도 하고 code 를 담아 돌려주기도 한다. 둘 다 받는다.
    return sdkError(e);
  }

  // 리다이렉트 방식(대부분의 모바일)은 여기로 돌아오지 않는다 — 이미 인증창으로 떠난 뒤다
  if (!res) return { kind: "left" };
  if (res.code !== undefined) return sdkError(res);
  return confirmIdentity(res.identityVerificationId);
}

/**
 * 인증창을 여는 단계에서 난 오류를 손님에게 보일 말로 바꾼다.
 *
 * 설정이 틀렸을 때 나오는 말("channelKey is not correct" 같은)은 손님이 읽을 문장이 아니다 — 뭉뚱그려 보이고
 * 원문은 콘솔에 남긴다. 반대로 "사용자가 취소하였습니다" 류는 그대로 보여 주는 편이 친절하다.
 */
function sdkError(e: unknown): IdentityOutcome {
  const err = (e ?? {}) as { code?: string; message?: string; pgMessage?: string };
  console.error("[identity]", err.code, err.message, err.pgMessage);
  const raw = (err.message || err.pgMessage || "").trim();
  const setupProblem = err.code === "UnknownError" || /channel|store|가맹점|계약|not correct|조회/i.test(raw);
  return {
    kind: "error",
    code: err.code,
    message: setupProblem || !raw ? "지금은 본인확인을 할 수 없습니다. 잠시 후 다시 시도해 주세요." : raw,
  };
}
