/**
 * 사이트 전역 설정 — 브랜드 문구, 기본 운영 규칙, 사유 코드.
 * 매장 마스터 데이터는 ./stores.ts 에 있다.
 */

export const BRAND = {
  /** 이벤트 이름 — 사장님 포스터 기준 */
  name: "알콜부시기",
  hanja: "",
  /** 한 줄 설명 */
  tagline: "소주·맥주·막걸리, 서면 3가게 콜라보. 한 매장 영수증으로 50m 안 다른 매장에서 특별 혜택.",
  /** 연합 설명 */
  unionName: "서면 3가게 콜라보",
  /** 짧은 규칙 문구 */
  ruleOneLiner: "한 매장 이용 후 영수증을 올리면, 50m 안 다른 매장에서 메인안주 1개 주문 시 매장별 특별 혜택을 드려요.",
  /** 포스터 문구 */
  eventTag: "영수증 릴레이 EVENT",
  course: "50m 안에서 즐기는 1차·2차·3차",
  condition: "당일 영수증 한정 · 테이블당 1회 · 메인안주 1개 주문 시",
  slogan: "GOOD DRINKS GOOD FOOD GOOD PEOPLE in SEOMYEON",
} as const;

export type StoreId = "joseon" | "tokyo" | "wareureu";
export const STORE_IDS: StoreId[] = ["joseon", "tokyo", "wareureu"];

/** 운영 규칙 — 관리자 화면(설정)에서 바꿀 수 있고, DB settings 테이블이 우선한다. */
export type Rules = {
  /** 영수증 결제 시각으로부터 인정되는 시간(시간 단위) */
  receiptValidHours: number;
  /** 발급된 쿠폰의 유효 기간(일). 승인된 영수증으로 증정 쿠폰을 고를 수 있는 기간도 같다 */
  couponValidDays: number;
  /** 인정 최소 결제 금액(원). 0이면 제한 없음 */
  minAmount: number;
  /** 이 금액(원)을 넘는 결제는 자동 승인하지 않고 직원 확인으로 보낸다. 0이면 제한 없음 */
  maxAutoAmount: number;
  /** 회원 1명당 하루 영수증 인증 한도(승인·확인 대기 건 기준) */
  dailyLimitPerMember: number;
  /** 회원 1명당 하루 업로드 시도 한도(반려 건 포함). 넘으면 인식 없이 반려 */
  dailyAttemptLimit: number;
  /** 사이트 전체의 하루 자동 인식(OCR) 호출 상한. 넘으면 직원 확인으로만 접수 */
  dailyOcrLimit: number;
  /** 유사 이미지 판정 dHash 해밍 거리 임계값(0~64). 작을수록 엄격 */
  similarHashThreshold: number;
  /** 인식 신뢰도가 이 값 미만이면 관리자 확인으로 보냄 */
  minConfidence: number;
  /** 누적 결제 금액 등급 (오름차순) */
  tiers: { key: string; name: string; minSpend: number }[];
  /** 이벤트 진행 여부. false면 인증을 받지 않고 안내 문구만 노출 */
  eventActive: boolean;
  /** 홈/지갑 상단 공지 (비우면 숨김) */
  notice: string;
};

export const DEFAULT_RULES: Rules = {
  receiptValidHours: 24,
  couponValidDays: 30,
  minAmount: 10000,
  maxAutoAmount: 1000000,
  dailyLimitPerMember: 3,
  dailyAttemptLimit: 10,
  dailyOcrLimit: 500,
  similarHashThreshold: 8,
  minConfidence: 0.6,
  tiers: [
    { key: "regular", name: "단골", minSpend: 100000 },
    { key: "vip", name: "VIP", minSpend: 300000 },
    { key: "vvip", name: "VVIP", minSpend: 700000 },
  ],
  eventActive: true,
  notice: "",
};

/** 영수증 판정 사유 코드 (DB receipts.reasons 에 저장). 손님·관리자 화면 모두 이 문장을 그대로 쓴다 — 합쇼체. */
export const REASONS = {
  NOT_RECEIPT: "영수증으로 보이지 않는 사진이에요.",
  STORE_MISMATCH: "참여 매장의 영수증이 아니에요.",
  STORE_UNKNOWN: "매장명을 읽지 못해서 직원이 확인해요.",
  BIZNO_MISMATCH: "사업자등록번호가 등록된 매장과 달라서 직원이 확인해요.",
  DATE_UNREADABLE: "결제 일시를 읽지 못해서 직원이 확인해요.",
  EXPIRED: "결제하고 인정 시간이 지났어요.",
  FUTURE_DATE: "결제 일시가 지금보다 뒤예요.",
  MIN_AMOUNT: "최소 결제 금액에 못 미쳐요.",
  AMOUNT_TOO_HIGH: "결제 금액이 커서 직원이 확인해요.",
  NO_APPROVAL_NO: "승인번호가 없거나 흐려서 직원이 확인해요.",
  CANCELLED: "결제가 취소된 전표예요.",
  DUPLICATE_IMAGE: "이미 올린 사진이에요.",
  SIMILAR_IMAGE: "이미 올린 영수증과 아주 비슷한 사진이에요.",
  DUPLICATE_RECEIPT: "이미 쓴 영수증이에요(승인번호 일치).",
  DUPLICATE_FINGERPRINT: "같은 매장·시각·금액의 영수증이 이미 있어요.",
  DAILY_LIMIT: "오늘 인증할 수 있는 횟수를 다 썼어요.",
  SCREEN_PHOTO: "화면을 다시 찍은 사진으로 보여요.",
  REPRINT: "재출력 영수증으로 보여요.",
  ORDER_SLIP: "결제 영수증이 아니라 주문서(빌지)로 보여요.",
  SUSPICIOUS_TEXT: "영수증에 이상한 문구가 있어서 직원이 확인해요.",
  LOW_CONFIDENCE: "일부 항목이 흐려서 직원이 확인해요.",
  OCR_UNAVAILABLE: "지금은 직원이 사진을 직접 확인해요.",
  OCR_ERROR: "사진을 읽지 못해서 직원이 확인해요.",
  EVENT_INACTIVE: "지금은 이벤트 기간이 아니에요.",
  PICK_EXPIRED: "무료 증정 쿠폰을 고를 수 있는 기간이 지났어요.",
  MANUAL_APPROVED: "직원이 확인하고 승인했어요.",
  MANUAL_REJECTED: "직원이 확인하고 반려했어요.",
} as const;

export type ReasonCode = keyof typeof REASONS;

export function reasonText(code: string): string {
  return (REASONS as Record<string, string>)[code] ?? code;
}

/** 전화번호 정규화: 숫자만, 010/011/016/017/018/019 로 시작하는 10~11자리 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  if (!/^01[016789]/.test(digits)) return null;
  return digits;
}

export function formatPhone(digits: string): string {
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

/** 전화번호 마스킹: 010-****-5678 */
export function maskPhone(digits: string): string {
  const f = formatPhone(digits);
  const parts = f.split("-");
  if (parts.length === 3) return `${parts[0]}-${"*".repeat(parts[1]!.length)}-${parts[2]}`;
  return f;
}

export function formatWon(n: number | null | undefined): string {
  if (n == null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}

/** 사이트 공개 주소. NEXT_PUBLIC_SITE_URL 이 없으면 Vercel 이 주는 운영 도메인(VERCEL_PROJECT_PRODUCTION_URL)을 쓴다. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000"
).replace(/\/$/, "");
