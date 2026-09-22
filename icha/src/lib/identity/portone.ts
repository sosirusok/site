/**
 * 휴대폰 본인확인 — 포트원(PortOne) V2 연동의 서버 쪽.
 *
 * 왜 포트원인가: 통신사 선택 → 이름·생년월일·휴대폰번호를 넣는 그 창은 우리가 그리는 화면이 아니라
 * 본인확인기관(다날 / NHN KCP / KG이니시스)이 띄우는 창이다. 직접 계약하면 SEED 암호화까지 우리가 해야 하지만,
 * 포트원을 통하면 같은 창을 그대로 호출하면서 연동은 함수 한 번 + REST 조회 한 번으로 끝난다.
 * 유사한 화면을 우리가 만드는 것이 아니다 — 실제 기관 창이 뜬다.
 *
 * 흐름
 *   1) 브라우저: PortOne.requestIdentityVerification({ storeId, identityVerificationId, channelKey, redirectUrl })
 *   2) 기관 창에서 인증 (모바일은 대부분 redirectUrl 로 되돌아온다)
 *   3) 서버: GET https://api.portone.io/identity-verifications/{id}  (Authorization: PortOne {API_SECRET})
 *      → status 가 VERIFIED 면 verifiedCustomer 를 믿을 수 있다
 *
 * 규격 출처(2026-09 확인): https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2
 * 응답 타입은 @portone/server-sdk 의 VerifiedIdentityVerification 과 맞춰 두었다.
 */
import { z } from "zod";

const API_BASE = "https://api.portone.io";

/** 포트원 콘솔에서 발급받는 값들. 셋 다 있어야 본인확인을 켠다 */
export type IdentityConfig = {
  storeId: string;
  channelKey: string;
  apiSecret: string;
  /** 계약한 본인확인 채널의 PG. bypass 파라미터가 PG마다 달라서 구분이 필요하다 */
  pg: "danal" | "kcp" | "inicis" | null;
  /** 다날 인증창에 표시되는 서비스 이름 (CPTITLE) */
  serviceName: string;
};

/**
 * 환경변수를 읽어 설정을 만든다. 하나라도 비어 있으면 null — 화면은 본인확인 없이 동작한다.
 * 값이 바뀌면 재배포가 필요하다(Vercel 환경변수 저장 시 자동 재배포).
 */
export function identityConfig(): IdentityConfig | null {
  const storeId = process.env.PORTONE_STORE_ID?.trim();
  const channelKey = process.env.PORTONE_CHANNEL_KEY?.trim();
  const apiSecret = process.env.PORTONE_API_SECRET?.trim();
  if (!storeId || !channelKey || !apiSecret) return null;
  const raw = process.env.PORTONE_IDENTITY_PG?.trim().toLowerCase();
  const pg = raw === "danal" || raw === "kcp" || raw === "inicis" ? raw : null;
  return { storeId, channelKey, apiSecret, pg, serviceName: process.env.PORTONE_SERVICE_NAME?.trim() || "알콜부시기" };
}

export function identityEnabled(): boolean {
  return identityConfig() !== null;
}

/**
 * 로컬 개발용 가짜 인증. 운영에서는 절대 켜지지 않는다 —
 * Vercel 은 미리보기 배포까지 NODE_ENV=production 이라 이 조건이 참이 되는 곳은 내 컴퓨터뿐이다.
 */
export function identityMock(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.PORTONE_IDENTITY_MOCK === "1";
}

/** 통신사 코드 — 응답에 그대로 들어온다 */
const Operator = z.enum(["SKT", "KT", "LGU", "SKT_MVNO", "KT_MVNO", "LGU_MVNO"]).or(z.string());

const VerifiedCustomer = z.object({
  id: z.string().optional(),
  name: z.string(),
  operator: Operator.optional(),
  /** 하이픈 없는 숫자만. 다날은 별도 계약, KCP·KG이니시스는 항상 제공 */
  phoneNumber: z.string().optional(),
  /** yyyy-MM-dd. 포트원 V2 본인인증 건은 항상 존재 */
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  isForeigner: z.boolean().optional(),
  /** 사람마다 고유. 서비스가 달라도 같다 — 우리는 저장하지 않는다 */
  ci: z.string().optional(),
  /** 우리 사이트 안에서만 고유. 중복 가입 확인용 */
  di: z.string().optional(),
});

const IdentityVerification = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("VERIFIED"),
    id: z.string(),
    verifiedCustomer: VerifiedCustomer,
    verifiedAt: z.string().optional(),
    customData: z.string().optional(),
  }),
  z.object({ status: z.literal("READY"), id: z.string() }),
  z.object({ status: z.literal("FAILED"), id: z.string() }),
]);

export type VerifiedCustomer = z.infer<typeof VerifiedCustomer>;

export type LookupResult =
  | { ok: true; customer: VerifiedCustomer }
  | { ok: false; reason: "ready" | "failed" | "not-found" | "bad-response" | "upstream" };

/**
 * 본인인증 단건 조회. 브라우저가 보낸 결과는 믿지 않고 반드시 이 함수로 서버에서 다시 확인한다 —
 * identityVerificationId 는 주소창에 그대로 보이므로 남의 것을 붙여 넣어 볼 수 있다.
 */
export async function lookupVerification(cfg: IdentityConfig, identityVerificationId: string): Promise<LookupResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/identity-verifications/${encodeURIComponent(identityVerificationId)}`, {
      headers: { Authorization: `PortOne ${cfg.apiSecret}` },
      cache: "no-store",
    });
  } catch (e) {
    console.error("[identity] 포트원 조회 실패", e);
    return { ok: false, reason: "upstream" };
  }
  if (res.status === 404) return { ok: false, reason: "not-found" };
  if (!res.ok) {
    console.error("[identity] 포트원 응답", res.status, await res.text().catch(() => ""));
    return { ok: false, reason: "upstream" };
  }
  const parsed = IdentityVerification.safeParse(await res.json().catch(() => null));
  if (!parsed.success) {
    console.error("[identity] 예상과 다른 응답", parsed.error.issues);
    return { ok: false, reason: "bad-response" };
  }
  if (parsed.data.status === "READY") return { ok: false, reason: "ready" };
  if (parsed.data.status === "FAILED") return { ok: false, reason: "failed" };
  return { ok: true, customer: parsed.data.verifiedCustomer };
}
