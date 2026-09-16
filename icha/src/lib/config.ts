/**
 * 사이트 전역 설정 — 브랜드 문구, 기본 운영 규칙, 사유 코드.
 * 매장 마스터 데이터는 ./stores.ts 에 있다.
 */

export const BRAND = {
  /** 이벤트 이름 — 사장님 포스터 기준 */
  name: "알콜부시기",
  hanja: "",
  /** 한 줄 설명 */
  tagline: "소주·맥주·막걸리, 서면 3개 매장 콜라보. 한 매장 이용 후 50m 내 다른 매장에서 메인안주 1개 주문 시 매장별 특별 혜택을 드립니다.",
  /** 연합 설명 */
  unionName: "서면 3가게 콜라보",
  /** 짧은 규칙 문구 */
  ruleOneLiner: "계산 시 휴대폰 번호를 말씀하시면 쿠폰이 발급됩니다. 50m 내 다른 매장에서 메인안주 1개 주문 시 매장별 특별 혜택을 드립니다.",
  /** 포스터 문구 */
  eventTag: "영수증 릴레이 EVENT",
  course: "50m 안에서 즐기는 1차·2차·3차",
  condition: "테이블당 1회 · 메인안주 1개 주문 시",
  slogan: "GOOD DRINKS GOOD FOOD GOOD PEOPLE in SEOMYEON",
} as const;

export type StoreId = "joseon" | "tokyo" | "wareureu";
export const STORE_IDS: StoreId[] = ["joseon", "tokyo", "wareureu"];

/** 운영 규칙 — 관리자 화면(설정)에서 바꿀 수 있고, DB settings 테이블이 우선한다. */
export type Rules = {
  /** 영수증 결제 시각으로부터 인정되는 시간(시간 단위) */
  receiptValidHours: number;
  /** 당일(한국 시간 기준 같은 날) 영수증만 인정 — 포스터 "당일 영수증 한정" */
  sameDayOnly: boolean;
  /** 매장별 오늘의 소식(관리자가 적음, 비우면 숨김) */
  storeNotices: Record<StoreId, string>;
  /** 네이버 리뷰 이벤트: 매장별 혜택 문구(비우면 숨김). 예: "네이버 리뷰 작성 시 소주 1병" */
  reviewBenefit: Record<StoreId, string>;
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
  sameDayOnly: true,
  storeNotices: { joseon: "", tokyo: "", wareureu: "" },
  reviewBenefit: { joseon: "", tokyo: "", wareureu: "" },
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

/** 영수증 판정 사유 코드 (DB receipts.reasons 에 저장). 손님·관리자 화면 모두 이 문장을 그대로 쓴다 — 합니다체, 상태 + 조치. */
export const REASONS = {
  NOT_RECEIPT: "영수증으로 확인되지 않는 사진입니다.",
  STORE_MISMATCH: "참여 매장의 영수증이 아닙니다.",
  STORE_UNKNOWN: "매장명을 읽을 수 없어 직원이 확인합니다.",
  BIZNO_MISMATCH: "사업자등록번호가 등록 매장과 달라 직원이 확인합니다.",
  DATE_UNREADABLE: "결제 일시를 읽을 수 없어 직원이 확인합니다.",
  EXPIRED: "결제 후 인정 시간이 지났습니다.",
  FUTURE_DATE: "결제 일시가 현재 시각 이후입니다.",
  MIN_AMOUNT: "최소 결제 금액 미만입니다.",
  AMOUNT_TOO_HIGH: "결제 금액이 커 직원이 확인합니다.",
  NO_APPROVAL_NO: "승인번호가 없거나 흐려 직원이 확인합니다.",
  CANCELLED: "결제가 취소된 전표입니다.",
  DUPLICATE_IMAGE: "이미 등록된 사진입니다.",
  SIMILAR_IMAGE: "이미 등록된 영수증과 유사한 사진입니다.",
  DUPLICATE_RECEIPT: "이미 사용된 영수증입니다(승인번호 일치).",
  DUPLICATE_FINGERPRINT: "같은 매장·시각·금액의 영수증이 이미 등록되어 있습니다.",
  DAILY_LIMIT: "오늘 인증 가능 횟수를 초과했습니다.",
  SCREEN_PHOTO: "화면을 재촬영한 사진으로 판단됩니다.",
  REPRINT: "재출력 영수증으로 판단됩니다.",
  ORDER_SLIP: "결제 영수증이 아닌 주문서(빌지)로 판단됩니다.",
  SUSPICIOUS_TEXT: "영수증에 확인이 필요한 문구가 있어 직원이 확인합니다.",
  LOW_CONFIDENCE: "일부 항목이 흐려 직원이 확인합니다.",
  OCR_UNAVAILABLE: "현재 직원이 사진을 직접 확인합니다.",
  OCR_ERROR: "사진을 읽을 수 없어 직원이 확인합니다.",
  EVENT_INACTIVE: "이벤트 기간이 아닙니다.",
  PICK_EXPIRED: "쿠폰 선택 기간이 지났습니다.",
  MANUAL_APPROVED: "직원 확인 후 승인되었습니다.",
  COUNTER: "매장 카운터에서 발급된 쿠폰입니다.",
  MANUAL_REJECTED: "직원 확인 후 반려되었습니다.",
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
