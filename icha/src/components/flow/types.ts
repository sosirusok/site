/** 흐름 화면(클라이언트 컴포넌트)에 넘기는 직렬화 가능한 타입들. API 응답 형식은 src/app/api/** 와 맞춘다. */

export type StoreLite = {
  id: "joseon" | "tokyo" | "wareureu";
  shortName: string;
  name: string;
  drink: "막걸리" | "맥주" | "소주";
};

export type UploadRules = {
  receiptValidHours: number;
  dailyLimitPerMember: number;
  minAmount: number;
  couponValidDays: number;
};

/** POST /api/receipts 성공 응답 */
export type ReceiptApiOk = {
  ok: true;
  receipt: {
    id: string;
    status: "approved" | "review" | "rejected";
    storeId: string | null;
    amount: number | null;
    receiptAt: string | null;
    reasons: { code: string; text: string }[];
    createdAt: string;
  };
  giftStoreIds: string[];
  read: {
    merchant: string | null;
    paidAt: string | null;
    amount: number | null;
    approvalNo: string | null;
    items: { name: string; qty: number | null; amount: number | null }[];
  } | null;
};

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
