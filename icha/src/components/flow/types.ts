/** 흐름 화면(클라이언트 컴포넌트)에 넘기는 직렬화 가능한 타입들. API 응답 형식은 src/app/api/** 와 맞춘다. */

export type ApiFail = { ok: false; error: string };

/** POST /api/coupons/issue 성공 응답 */
export type IssueApiOk = {
  ok: true;
  coupon: { id: string; code: string; useStoreId: string; menuName: string; expiresAt: string };
};

/** POST /api/coupons/:id/redeem 성공 응답 */
export type RedeemApiOk = {
  ok: true;
  coupon: { id: string; status: "active" | "used" | "expired" | "void"; usedAt: string | null };
};
